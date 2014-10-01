define(function(require, exports) {

	var 
		$ = require('jquery'),
		Class = require('lib/class'),
		hb = require('lib/handlebars'),
		pretty = require('lib/pretty'),
		moment = require('moment-timezone'),

		Trail = require('misc/Trail'),
		Foodle = require('models/Foodle'),
		// User = require('models/User'),
		FoodleResponse = require('models/FoodleResponse')

		;

	// var t = require('lib/text!templates/foodleresponse.html');
	// var template = hb.compile(t);

	var MyResponseController = Class.extend({
		"init": function(api, foodle, user, myresponse, el) {
			var that = this;
			this.user = user;

			this.callbacks = {};

			this.api = api;
			this.foodle = foodle;
			this.myresponse = myresponse;
			this.el = el;

			this.trail = null;
			if (this.foodle.restrictions && this.foodle.restrictions.checklimit) {
				this.trail = new Trail(this.foodle.restrictions.checklimit);
			}

			// this.responses = null;
			// this.geocoder = new google.maps.Geocoder();

			// console.log("›› Foodle object", foodle);
			// console.log(" › My response", myresponse);


			// this.el.on('click', 'input', function(e) {
			// 	e.preventDefault();
			// });
			this.el.on('click', '.checkCell', function(e) {
				e.stopPropagation();  // e.preventDefault(); 
				var obj = $(e.currentTarget).find('input');

				var val = obj.prop('checked');
				var colno = obj.data('col');

				if (e.currentTarget === e.target) {
					val = !val;
					obj.prop('checked', val);
				}

				if (that.trail) {
					if (val) {
						that.trail.check(colno);
					} else {
						that.trail.uncheck(colno);
					}

					var extr = that.trail.wipeOld();
					if (extr !== null) {
						$('#myresp-col-' + extr).prop('checked', false);
					}
					// console.error("Extract", extr);
				}
			});

			this.el.on('click', '.checkRadioCell', function(e) {
				e.stopPropagation();
				var obj = $(e.currentTarget).find('input');
				obj.prop('checked', true);
				var value = parseInt(obj.attr('value'), 10);
				var colno = obj.data('col');

				// console.log("Click handling of ", value, colno);

				if (that.trail) {
					if (value === 1) {
						that.trail.check(colno);
					} else {
						that.trail.uncheck(colno);
					}

					var extr = that.trail.wipeOld();
					if (extr !== null) {
						// console.log("About to uncheck col", extr);
						$('input[name="myresp-col-' + extr + '"][value="0"]').prop('checked', true);
					}
					// console.error("Extract", extr);
				}
			});

			this.el.on('click', '.smtresponse', function(e) {
				e.preventDefault(); e.stopPropagation();

				// console.log("Submit response", "User is", that.user);

				if (!that.user) {
					// console.log("User it not registgering");
					that.registerUser(function() {
						// console.log("Now submit");
						that.submitResponse();
					});
				} else {
					that.submitResponse();					
				}
			});

			// this.draw();
			// this.loadResponses();
		},

		"setMyResponse": function(r) {
			this.myresponse = r;
			this.draw();
		},

		"on": function(evnt, callback) {
			this.callbacks[evnt] = callback;
		},

		"trigger": function(evnt) {
			var args = Array.prototype.slice.call(arguments, 1);
			if (this.callbacks && this.callbacks[evnt] && typeof this.callbacks[evnt] === 'function') {
				this.callbacks[evnt].apply(this, args);
			}
		},

		"registerUser": function(callback) {
			var that = this;

			var name = $('#regName').val();
			var email = $('#regEmail').val();

			if (name) {
				$('#regNameP').removeClass('has-error'); // .removeClass('has-feedback');
			} else {
				$('#regNameP').addClass('has-error'); // .addClass('has-feedback');
				$('#regName').focus();
				return;
			}

			if (email) {
				$('#regEmailP').removeClass('has-error'); // .removeClass('has-feedback');
			} else {
				$('#regEmailP').addClass('has-error'); // .addClass('has-feedback');
				$('#regEmail').focus();
				return;
			}

			// console.error('Registering user ', name, email);

			this.api.createAnonymousSession(name, email, function(response) {
				// console.log("Registering success. Token ", response.token);
				// console.log("Registering success. User ", response.user);
				that.api.token = response.token;
				that.user = response.user;
				that.trigger('register', response.user);
				that.submitResponse();
			});
		},

		"submitResponse": function() {
			// console.log("Processing submitResponse()");

			var response = new FoodleResponse();
			response.setFoodle(this.foodle);
			var no = this.foodle.getColNo();

			// console.log("About to submit response. Checking through ", no);

			// TODO. Not supported in IE8.0
			// var data = Array.apply(null, new Array(no)).map(Number.prototype.valueOf,0);

			var data = [];
			for(var i = 0; i < no; i++) {
				data.push(0);
			}

			for(var i = 0; i < no; i++) {
				// var m = $("input[name='myresp-col-" + i + "']");
				var x = null;

				if (this.foodle.responsetype && this.foodle.responsetype === "yesnomaybe") {
					var m = $("input[name='myresp-col-" + i + "']:checked");
					if (m.size() > 0) {
						x = m.val();
					} else {
						// this col is not filled out. Defaults to 'null'.
						// console.error('Did not find a match for ' + "input[name='myresp-col-" + i + "']:checked");
					}
				} else {
					x = ($("#myresp-col-" + i).prop('checked') ? 1 : 0);
				}
				if (x !== null) {
					data[i] = x;
				}
			}

			var comment = $('#myResponseComment').val();
			if (comment && comment !== '') {
				response.notes = comment;
			}

			response.setData(data);

			// console.log("Full response data", data);
			this.trigger('response', response);
		},

		"getResponseCell": function(i) {
			if (parseInt(i, 10) === 1) {
				return '<td class="responseCellYes"><span class="glyphicon glyphicon-ok"></span></td>';
			} else if (parseInt(i, 10) === 0) {
				return '<td class="responseCellNo"><span class="glyphicon glyphicon-remove"></span></td>';
			} else if (parseInt(i, 10) === 2) {
				return '<td class="responseCellMaybe"><span class="glyphicon glyphicon glyphicon-question-sign"></span></td>';
			} else {
				// console.log("Value was ", i);
				return '<td class="responseCellFail"><span class="glyphicon glyphicon glyphicon-info-sign"></span></td>';
			}
		},

		"drawSimpleNew": function() {
			var no = this.foodle.getColNo(),
				r;

			var setrow2 = $('<tr></tr>');

			if (this.myresponse) {
				setrow2.append('<th colspan="2" style="text-align: right">Update my response</th>');
			} else if (this.user !== null) {
				setrow2.append('<th colspan="2" ><span class="glyphicon glyphicon-user"></span> ' + this.user.username + '</th>');
			} else {
				setrow2.append('<td colspan="2" class="regcol" >' + 
					'<div id="regNameP" class="col-md-7"><input id="regName" type="text" class="form-control " placeholder="' + window._d.displayname + '" /></div>' + 
					'<div id="regEmailP" class="col-md-5"><input id="regEmail" type="text" class="form-control " placeholder="' + window._d.email + '" /></div>' + 
					'</td>');
			}

			if (this.foodle.restrictions && this.foodle.restrictions.checklimit) {
				this.trail = new Trail(this.foodle.restrictions.checklimit);
			}
			
			for(var i = 0; i < no; i++) {
				var checked = false;
				if (this.myresponse) {
					r = this.myresponse.getResponse(i);
					checked = (r === 1);
				}

				if (checked && this.trail) {
					this.trail.check(i);	
				}

				setrow2.append('<td class="checkCell" style="text-align: center; vertical-align: center">' + 
					'<input data-col="' + i + '" id="myresp-col-' + i + '" ' + (checked ? ' checked="checked" ' : '') + ' type="checkbox" />' +
					'</td>');
			}

			var savetext = _d.save;
			if (this.myresponse) {
				savetext = _d.update;
			} 
			setrow2.append('<td rowspan="2" id="cellSave" style="text-align: center; vertical-align: center">' + 
				'<button style="margin: 2px; display: block" class="btn btn-sm btn-primary smtresponse">' + savetext + '</button>' + 
				'<img style="display: none" id="cellSaveSpinning" alt="spinnig wheel" src="/res/img/spinning.gif" />' +
				'</td>');
			this.el.append(setrow2);

			var existingComment = '';
			if (this.myresponse && this.myresponse.notes) {
				existingComment = this.myresponse.notes;
			} 

			var fcolno = (no + 2);
			var setCommentRow = $('<tr></tr>');
			setCommentRow.append('<td colspan="' + (fcolno) + '"><input type="text" id="myResponseComment" value="' + existingComment + '" placeholder="' + window._d.optionalcomment + '" class="form-control" /></td>');
			this.el.append(setCommentRow);

			if (this.user === null) {
				$('#regName').focus();
			}
		},

		"drawMaybe": function() {
			var no = this.foodle.getColNo(),
				r;

			if (this.foodle.restrictions && this.foodle.restrictions.checklimit) {
				this.trail = new Trail(this.foodle.restrictions.checklimit);
			}

			var setrow1 = $('<tr></tr>');
			var setrow2 = $('<tr></tr>');
			var setrow3 = $('<tr></tr>');

			if (this.myresponse) {
				setrow1.append('<th rowspan="3" style="text-align: right">Update my response</th>');
			} else if (this.user !== null) {
				setrow1.append('<th rowspan="3" ><span class="glyphicon glyphicon-user"></span> ' + this.user.username + '</th>');
			} else {
				// setrow1.append('<th rowspan="3" >' + 
				// 	'<input type="text" class="form-control" />' + 
				// 	'</th>');
				setrow1.append('<td rowspan="3" class="regcol" >' + 
					'<div id="regNameP" class="col-md-7"><input id="regName" type="text" class="form-control " placeholder="' + window._d.displayname + '" /></div>' + 
					'<div id="regEmailP" class="col-md-5"><input id="regEmail" type="text" class="form-control " placeholder="' + window._d.email + '" /></div>' + 
					'</td>');
			}

			setrow1.append(this.getResponseCell(1));
			setrow2.append(this.getResponseCell(2));
			setrow3.append(this.getResponseCell(0));

			for(var i = 0; i < no; i++) {
				var current = 0;
				if (this.myresponse) {
					current = this.myresponse.getResponse(i);
				}

				if (current === 1 && this.trail) {
					this.trail.check(i);	
				}

				setrow1.append(
					'<td class="checkRadioCell responseCellYes" style="text-align: center; vertical-align: center">' + 
					'<input ' + (current === 1 ? ' checked="checked" ' : '') + ' data-col="' + i + '" name="myresp-col-' + i + '" value="1" type="radio" />' +
					'</td>');

				setrow2.append(
					'<td class="checkRadioCell responseCellMaybe" style="text-align: center; vertical-align: center">' + 
					'<input ' + (current === 2 ? ' checked="checked" ' : '') + ' data-col="' + i + '" name="myresp-col-' + i + '" value="2" type="radio" />' +
					'</td>');

				setrow3.append(
					'<td class="checkRadioCell responseCellNo" style="text-align: center; vertical-align: center">' + 
					'<input ' + (current === 0 ? ' checked="checked" ' : '') + ' data-col="' + i + '" name="myresp-col-' + i + '" value="0" type="radio" />' +
					'</td>');
			}

			var savetext = 'Save';
			if (this.myresponse) {
				savetext = 'Update';
			} 
			setrow1.append('<td id="cellSave" rowspan="4" style="text-align: center; vertical-align: center">' + 
				'<button style="margin: 2px; display: block" class="btn btn-sm btn-primary smtresponse">' + savetext + '</button>' + 
				'<img style="display: none" id="cellSaveSpinning" alt="spinnig wheel" src="/res/img/spinning.gif" />' +
				'</td>');
			this.el.append(setrow1);

			this.el.append(setrow1);
			this.el.append(setrow2);
			this.el.append(setrow3);

			var existingComment = '';
			if (this.myresponse && this.myresponse.notes) {
				existingComment = this.myresponse.notes;
			} 

			var fcolno = (no + 2);
			var setCommentRow = $('<tr></tr>');
			setCommentRow.append('<td colspan="' + (fcolno) + '"><input type="text" id="myResponseComment" value="' + existingComment + '" placeholder="' + window._d.optionalcomment + '" class="form-control" /></td>');
			this.el.append(setCommentRow);

			if (this.user === null) {
				$('#regName').focus();
			}
		},

		"getResponseCell": function(i) {
			if (parseInt(i, 10) === 1) {
				return '<td class="responseCellYes"><span class="glyphicon glyphicon-ok"></span></td>';
			} else if (parseInt(i, 10) === 0) {
				return '<td class="responseCellNo"><span class="glyphicon glyphicon-remove"></span></td>';
			} else if (parseInt(i, 10) === 2) {
				return '<td class="responseCellMaybe"><span class="glyphicon glyphicon glyphicon-question-sign"></span></td>';
			} else {
				return '<td class="responseCellFail"><span class="glyphicon glyphicon glyphicon-info-sign"></span></td>';
			}
		},

		"drawMyResponse": function() {
			var no = this.foodle.getColNo();
			var row = $('<tr></tr>');
			row.append('<th colspan="2" ><span class="glyphicon glyphicon-user"></span> ' + this.myresponse.username + '</th>');
			
			for(var j = 0; j < this.myresponse.response.data.length; j++) {
				row.append(this.getResponseCell(this.myresponse.getResponse(j)));
			}

			var created = moment.unix(this.myresponse.created);
			var ct = created.fromNow(true);

			if (this.myresponse.updated !== this.myresponse.created) {

				var udpated = moment.unix(this.myresponse.updated);
				var ut = udpated.fromNow(true);
				row.append('<td style="color: #755"><span class="glyphicon glyphicon-time"></span> ' + ut + '</td>');
			} else {
				row.append('<td><span class="glyphicon glyphicon-time"></span> ' + ct + '</td>');
			}

			this.el.append(row);
		},

		"draw": function() {
			var that = this;

			this.el.empty();

			if (this.foodle.locked() || this.foodle.lockedRestriction()) {
				// console.error('My response is locked');
			} else {
				if (this.foodle.responsetype && this.foodle.responsetype === "yesnomaybe") {
					this.drawMaybe();
				} else {
					this.drawSimpleNew();
				}
			}

			if (this.myresponse) {
				this.drawMyResponse();
			}
		}
	});

	return MyResponseController;
});