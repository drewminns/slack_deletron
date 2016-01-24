var slackApp = {},
		authWindow;

		// Create an app on api.slack.com and fill out your creds below
		slackApp.clientId = "clientID",
		slackApp.clientSecret = "clientSecret";
		slackApp.scope = "files:write:user files:read";
		slackApp.id = [];
		slackApp.count = 0;

slackApp.auth = function() {
	var $login = $('.login');
	$login.on('click', function(e) {
		e.preventDefault();
		authWindow = window.open('https://slack.com/oauth/authorize?client_id=' + slackApp.clientId+ '&scope=' + slackApp.scope, '', 'left=20,top=20,width=800,height=700,toolbar=0,resizable=1');

		var timer = setInterval(checkChildWindow, 500);

		function checkChildWindow() {
			if (authWindow.closed) {
				slackApp.codeQuery = window.dataCode;
				slackApp.parse(slackApp.codeQuery);
				clearInterval(timer);
			}
		}
	});
};
slackApp.parse = function() {
	function getParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(slackApp.codeQuery);
	    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	slackApp.code = getParameterByName('code');
	slackApp.getToken();
};

slackApp.getToken = function() {
	$.ajax({
		url: 'https://slack.com/api/oauth.access',
		type: 'GET',
		data: {
			client_id: slackApp.clientId,
			client_secret: slackApp.clientSecret,
			code: slackApp.code
		},
		success: function(data) {
			slackApp.token = data.access_token;
			slackApp.getIdentity();
		}
	});
};

slackApp.getIdentity = function() {
	$.ajax({
		url: 'https://slack.com/api/auth.test',
		type: 'GET',
		data: {
			token: slackApp.token
		},
		success: function(data) {
			slackApp.userID = data.user_id;
			slackApp.username = data.user;
			if (slackApp.codeQuery !== undefined ) {
				slackApp.displayPersona();
			}
		}
	});
};

slackApp.displayPersona = function() {
	var $loginWindow = $('.loginWindow'),
			$intro = $('.intro'),
			$persona = $('.persona'),
			$loggedIn = $('.loggedIn');

	$loginWindow.addClass('animated fadeOutUp');
	$intro.addClass('animated fadeOut');

	$loginWindow.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {		
		$(this).hide();
		$persona.addClass('animated fadeInUp');
		$persona.show();
		$loggedIn.addClass('animated fadeIn');
		$loggedIn.show();
	});
	$intro.one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function() {		
		$(this).hide();
	});

	
	$('.userName').text(slackApp.username);
	var selectedFileType = $('select#files option:selected').data('value');
	$('.fileType').text(selectedFileType);
	$("#files").on("change", function(){
			selectedFileType = $('select#files option:selected').data('value');
	    slackApp.fileType = $(this).val();
			$('.fileType').text(selectedFileType);
	});
	slackApp.deleteClick();
};

slackApp.deleteClick = function() {
	$('button.deleteBtn').on('click', function() {
		slackApp.count = 0;
		slackApp.fileType = $(this).val();
		slackApp.getFiles();
		// alert('hello');
	});
};

slackApp.getFiles = function() {
	$.ajax({
		url: 'https://slack.com/api/files.list',
		type: 'GET',
		data: {
			token: slackApp.token,
			user: slackApp.userID,
			types: slackApp.fileType
		},
		success: function(data) {
			console.log(data.files.length);
			if (!data.files.length <= 0) {
				slackApp.listFiles(data.files);
			} else {
				$('.count').show();
				$('.count').text('No files to delete! Yay!');
			}
		}
	});
};

slackApp.listFiles = function(files) {
	for (var i = 0; i < files.length; i++ ) {
		slackApp.id.push(files[i].id);
	}
	// console.log(slackApp.id);
	// console.log(files);
	slackApp.deleteFiles(slackApp.id);
};

slackApp.deleteFiles = function(id) {
	for (var i = 0; i < id.length; i++) {
		console.log(id[i]);
		$.ajax({
			url: 'https://slack.com/api/files.delete',
			type: 'GET',
			data: {
				token: slackApp.token,
				file: id[i]
			},
			success: function(data) {
				console.log(data);
				if (data.ok != false) {
					slackApp.count++;
					$('.count').show();
					$('.count span').text(slackApp.count);
				} else {
					$('.count span').text('You got em all!');
				}
			},
			error: function(data) {
				console.log('broken');
			}
		});
	}
};

slackApp.init = function() {
	slackApp.auth();
};

$(function() {
	slackApp.init();
});
