(function($, undefined){

	'use strict';

	$.timerlog_timer_i18n = {
		_p: {
			minutes: ['{0} minute', '{0} minutes'],
			hours: ['{0} hour', '{0} hours'],
			start: 'Start',
			stop: 'Stop',
			title: 'Timer',
			activeTimer: 'You have a running timer.',
			actionMerge: 'Merge with current',
			remove: 'Stop & Remove',
			openForm: 'Open form',
			removeConfirm: 'Are you sure?'
		},
		set: function(key, value)
		{
			if (typeof key == 'object')
			{
				for (var i in  key)
				{
					this.set(i, key[i]);
				}
				return this;
			}
			if (key === '_plural')
			{
				if ($.isFunction(value))
				{
					this.plural = value;
				}
				return this;
			}
			this._p[key + ''] = value;
			return this;
		},
		_: function(key)
		{
			key += '';
			var type = (typeof this._p[key]),
				_args = Array.prototype.slice.call(arguments);
			_args.shift();
			switch (type)
			{
				case 'undefined':
					return type;
				case 'function':
					return this._p[key].apply(this, _args);
				default:
					var func = this._format;
					if ($.isArray(this._p[key]))
					{
						func = this.plural;
						_args = _args.slice(0, 1);
						_args.push.apply(_args, this._p[key]);
					}
					else
					{
						_args.unshift(this._p[key]);
					}
					return func.apply(this, _args);
			}
		},
		_format: function()
		{
			var _args = Array.prototype.slice.call(arguments),
				_p = _args.shift(),
				len = _args.length;

			while (len--)
			{
				_p = _p.replace(new RegExp("\\{" + len + "\\}", "g"), _args[len]);
			}

			return _p;
		},
		/**
		 * Format language plural form
		 * Params 3-5 can omitted
		 * 3 params calls, second param used for 1 and third params for others
		 * 4 params calls, second param used for 1, third params for 2-4, fourth param for 0, 5+
		 * 5 params calls, second param used for 0, third params for [1,21,31...], fourth param for 2-4, fifth param for 5+
		 * @param {int|float} num
		 * @param {String} zero For 0
		 * @param {String} one For 1
		 * @param {String} [few=""] For 2-4
		 * @param {String} [many=""] For 5+
		 * @param {String} [other=""] For floats
		 * @return {String} _format applied, the num is the first argument {0}
		 */
		plural: function(num, zero, one, few, many, other)
		{
			var onum = num;
			num = parseFloat(num) || 0;
			var _num = parseInt(num),
				_float = parseFloat(num) - _num,
				_args = Array.prototype.slice.call(arguments).slice(1),
				str
				;

			switch (_args.length)
			{
				case 0:
				case 1:
				case 2:
					str = (num == 0 || _float || num > 1) ? _args[1] : _args[0];
					break;
				case 3:
					_args.unshift(_args[2]);
				case 4:
					_args.push(_args[3]);
				default:
					if (_float)
					{
						str = _args[4];
					}
					else if (_num == 0)
					{
						str = _args[0];
					}
					else if (_num % 10 == 1 && _num % 100 != 11)
					{
						str = _args[1];
					}
					else if (_num % 10 >= 2 && _num % 10 <= 4 && (_num % 100 < 10 || _num % 100 >= 20 ))
					{
						str = _args[2];
					}
					else
					{
						str = _args[3];
					}
			}

			return this._format.call(this, str, onum);
		}

	}.set($.timerlog_timer_i18n || {});

	/**
	 *
	 * @return {*}
	 */
	function timerlog_timer()
	{
		var val, timer, startTime,
			updateInterval = 30 * 1000,
			fieldSelector = '#time_entry_hours',
			field = $(fieldSelector).eq(0),
			event_namespace = '.timerlog_timer',
			storageName = 'timerlog_timer',
			lang = $.timerlog_timer_i18n,
			funcs = {
				init: function(){},
				startTimer: function(){},
				stopTimer: function(){},
				tick: function(){}
			},
			button, text, storageChecked, form, initialVal,
			initiated
			;

		if (field.length)
		{
			field.attr('autocomplete', 'off');
			funcs.init = function()
			{
				var tpl = $(
					'<span class="timerlog-timer"> <button class="timerlog-timer-button"></button>' + ' <em class="timerlog-timer-text"><small><span></span></small></em></span>'
				);
				button = tpl.find('button');
				text = tpl.find('em span');
				form = field.closest('form');
				initialVal = getVal(field.val());
				button.html(lang._('start')).click(function (e)
				{
					e.preventDefault();
					(timer ? funcs.stopTimer() : funcs.startTimer());

				});
				field.parent().append(tpl);

				form.bind('submit' + event_namespace, function(){
					funcs.stopTimer();
					saveTimer();
				});
			};

			funcs.startTimer = function ()
			{
				if (!storageChecked && !checkTimer())
				{
					return false;
				}
				funcs.stopTimer(true);
				val = getVal(field.val());
				startTime = getTimestamp();
				timer = window.setInterval(funcs.tick, updateInterval);
				button.html(lang._('stop'));
				//form.bind('submit' + event_namespace, funcs.stopTimer);
				funcs.tick();
				saveTimer(startTime,  getVal(getVal(field.val()) - initialVal));
			};

			funcs.stopTimer = function (notSaveStorage)
			{
				if (timer)
				{
					window.clearInterval(timer);
					timer = null;
				}
				funcs.tick();
				val = null;
				startTime = null;
				//form.unbind(event_namespace);
				button.html(lang._('start'));
				text.html('');

				if (!notSaveStorage)
				{
					saveTimer(undefined, getVal(getVal(field.val()) - initialVal));
				}
			};

			funcs.tick = function ()
			{
				if (startTime)
				{
					var diff = getTimestamp() - startTime,
						secs = diff / 3600,
						new_val = getVal(val + secs);
					field.val(number_format(new_val, 2, '.', ''));
					text.html(format_time(new_val));
				}
			}
		}
		else
		{
			funcs.init = function()
			{
				var data = store.get(storageName);
				if (data)
				{
					var
						tpl = $(
							'<span style="margin-left:1em">' + lang._('title') + ': <a class="timerlog-timer-text"></a></span>'
						),
						a = tpl.find('a');

					a.attr('href', data.p + data.s);

					$('#top-menu').append(tpl);

					if (data.t)
					{
						var tick = function()
						{
							var diff = getTimestamp() - data.t,
								hours = diff / 3600,
								new_val = getVal(data.h + hours);
							a.html(format_time(new_val));
						};
						tick();
						window.setInterval(tick, updateInterval);
					}
					else
					{
						a.html(format_time(data.h));
					}
				}

			};
		}

		// Init
		function init()
		{
			if (initiated)
				return false

			initiated = true;
			funcs.init();
			checkTimer();
		}

		if (field.length)
		{
			var up_block = $('#update #issue-form');
			if (up_block.length && !up_block.is(':visible'))
			{
				$('.icon.icon-edit').bind('click' + event_namespace, function(){
					init();
					$(this).unbind(event_namespace);
				});
			}
			else
			{
				init();
			}
		}
		else
		{
			init();
		}


		function checkTimer()
		{
			var data = store.get(storageName);
			if (data)
			{
				var setData = function ()
				{
					if (data.t)
					{
						startTime = data.t;
						val = initialVal + data.h;
						funcs.startTimer();
					}
					else
					{
						field.val(initialVal + data.h);
					}
				};

				if (data.p == location.pathname)
				{
					storageChecked = true;
					setData();
				}
				else
				{
					if (!field.length) // no time log form
					{

					}
					else
					{
						var dialog = $('<p>' + lang._('activeTimer') + '</p>');
						dialog.dialog({
							modal: true,
							//resizable: false,
							title: lang._('title'),
							close: function ()
							{
								dialog.remove()
							},
							buttons: [
								{
									text: lang._('actionMerge'),
									click: function ()
									{
										//saveTimer();
										storageChecked = true;
										setData();
										dialog.dialog('close');
									}
								},
								{
									text: lang._('openForm'),
									click: function ()
									{
										dialog.dialog('close');
										location.href = data.p + data.s;
									}
								},
								{
									text: lang._('remove'),
									click: function ()
									{
										if (confirm(lang._('removeConfirm')))
										{
											dialog.dialog('close');
											saveTimer();
											storageChecked = true;
										}
									}
								}
							]
						});
						return false;
					}
				}
			}

			return true;
		}

		function format_time(val)
		{
			var h = parseInt(val, 10),
				m = parseInt((val - h) * 60, 10);
			return (h ? lang._('hours', h) + ' ' : '') + lang._('minutes', (m > 0 && m < 10) ? '0' + m : m);
		}


		function getVal(val)
		{
			return Math.abs(parseFloat(number_format(val, 2, '.', ''))) || 0;
		}

		/**
		 * Save timer to storage
		 * @param (integer} timestamp
		 * @param {float} hours
		 */
		function saveTimer(timestamp, hours)
		{
			if (timestamp === undefined && hours === undefined)
			{
				store.remove(storageName);
				return;
			}
			var data = {
				p: location.pathname,
				s: location.search || '',
				t: timestamp || false,
				h: hours || 0
			};
			store.set(storageName, data);
		}
	}

	// Helpers

	/**
	 * phpjs.org
	 * @param {Number} number
	 * @param {Integer} [decimals=0]
	 * @param {String} [dec_point="."]
	 * @param {String} [thousands_sep=","]
	 * @return {String}
	 */
	function number_format(number, decimals, dec_point, thousands_sep)
	{
		// Strip all characters but numerical ones.
		number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
		var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
			sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
			dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
			s = '',
			toFixedFix = function (n, prec)
			{
				var k = Math.pow(10, prec);
				return '' + Math.round(n * k) / k;
			};
		// Fix for IE parseFloat(0.55).toFixed(0) = 0;
		s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
		if (s[0].length > 3)
		{
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		if ((s[1] || '').length < prec)
		{
			s[1] = s[1] || '';
			s[1] += new Array(prec - s[1].length + 1).join('0');
		}
		return s.join(dec);
	}

	/**
	 * Get current unix timestamp
	 * @return {Number}
	 */
	function getTimestamp()
	{
		return Math.round(new Date().getTime() / 1000);
	}


	// init
	$(timerlog_timer);
}(jQuery));
