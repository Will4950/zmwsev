/* global $ io bootstrap */

const socket = io({
	transports: ['websocket'],
	reconnectionAttempts: 600,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 3000,
	timeout: 20000
});

socket.io.on('reconnect', () => {
	window.location.reload();
});

socket.io.on('reconnect_attempt', (attempt) => {
	if (attempt >= 2) {
		$('#modal_problem').modal('show');
	}
});

socket.on('event', (event) => {
	let date = new Date(event.event_ts).toLocaleDateString('en-us') || 'Date';
	let time = new Date(event.event_ts).toLocaleTimeString('en-us') || '00:00:00';
	let eventObj = {
		eventDescription: `<span type='button'>[${date} ${time}] <span class='fw-bold'>${
			event.event || 'unknown event'
		}</span></span>`,
		eventData: event
	};
	$('#eventTable').bootstrapTable('prepend', eventObj);
});

socket.on('status', (data) => {
	if (data === false) {
		$('#noerror').show();
		$('#error').hide();
		$('#status-online').show();
		$('#status-offline').hide();
		$('#status-loading').hide();
	} else {
		$('#noerror').hide();
		$('#error').show();
		$('#error-message').text(data);
		$('#status-online').hide();
		$('#status-offline').show();
		$('#status-loading').hide();
	}
});

socket.on('heartbeat', () => {
	$('#status-online').show();
	$('#status-offline').hide();
	$('#status-loading').hide();
	$('#noerror').show();
	$('#error').hide();
	$('.status-text').fadeOut(150);
	$('.status-text').fadeIn(200);
});

socket.on('connected', () => {
	$('#status-online').show();
	$('#status-offline').hide();
	$('#status-loading').hide();
	$('#noerror').show();
	$('#error').hide();
});

socket.on('disconnected', () => {
	$('#status-offline').show();
	$('#status-online').hide();
	$('#status-loading').hide();
});

socket.on('error', (data) => {
	$('#status-offline').show();
	$('#status-online').hide();
	$('#status-loading').hide();
	$('#noerror').hide();
	$('#error').show();
	$('#error-message').text(data);
});

/* eslint-disable-next-line no-unused-vars */
function detailFormatter(index, row) {
	return '<pre>' + JSON.stringify(row.eventData, null, 2) + '</pre>';
}

/* eslint-disable-next-line no-unused-vars */
function eventButtons() {
	return {
		btnClearEvents: {
			text: 'Erase Events',
			icon: 'bi-eraser',
			event: eventsClear,
			attributes: {
				title: 'Erase event log'
			}
		}
	};
}

function eventsClear() {
	socket.emit('event', 'eventsClear', () => {
		$('#eventTable').bootstrapTable('removeAll');
	});
}

function save(ele) {
	var value = $(ele).val();

	socket.emit('save', {
		id: $(ele).attr('id'),
		type: $(ele).prop('tagName'),
		value
	});

	$(ele)
		.css({'box-shadow': 'inset 0 0 0 4px #27874c'})
		.animate({opacity: 1}, 400, 'swing', function () {
			$(ele).css({'box-shadow': ''}).animate({opacity: 1}, 'fast');
		});
}

$(() => {
	$('#eventTable').bootstrapTable('refreshOptions', {iconSize: 'sm'});

	$('.showhidepw').on('click', (event) => {
		var target = $('#' + $(event.currentTarget).attr('for'));
		var i = $(event.currentTarget).children('i');
		if (target.attr('type') == 'password') {
			target.attr('type', 'text');
			i.addClass('bi-eye-slash');
			i.removeClass('bi-eye');
		} else {
			target.attr('type', 'password');
			i.addClass('bi-eye');
			i.removeClass('bi-eye-slash');
		}
	});

	$('.save').on('change', (event) => {
		$(event.currentTarget).val($(event.currentTarget).val().replace(/\s/g, ''));
		save(event.currentTarget);
	});

	socket.emit('event', 'getStatus');
	socket.emit('event', 'getEvents');

	const tooltipTriggerList = document.querySelectorAll(
		'[data-bs-toggle="tooltip"]'
	);
	[...tooltipTriggerList].map(
		(tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
	);
});

window.addEventListener('pageshow', function (event) {
	var historyTraversal =
		event.persisted ||
		(typeof window.performance != 'undefined' &&
			window.performance.navigation.type === 2);
	if (historyTraversal) {
		window.location.reload();
	}
});
