(function($, undefined){

	'use strict';

	var fieldSelector = '#time_entry_hours';

	$.timerlog_timer_i18n = {
		_p: {
			minutes: ['{0} minute', '{0} minutes'],
			hours: ['{0} hour', '{0} hours'],
			start: 'Start',
			stop: 'Stop'
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

	$(function(){
		var field = $(fieldSelector),
			lang = $.timerlog_timer_i18n;

		if (!field.length)
			return;

		var timer,
			val,
			startTime,
			updateInterval = 30 * 1000,
			tpl = $(
				'<span class="timerlog-timer"> <button class="timerlog-timer-button"></button>'+ ' <em class="timerlog-timer-text"><small><span></span></small></em></span>'
			),
			button = tpl.find('button'),
			text = tpl.find('em span');

		button.html(lang._('start')).click(function(e){
				e.preventDefault();
				(timer ? stopTimer() : startTimer());

		});
		tpl.insertAfter(field);


		function startTimer()
		{
			stopTimer();
			val = getVal(field.val());
			startTime = getTimestamp();
			timer = window.setInterval(tick, updateInterval);
			button.html(lang._('stop'));
			tick();
		}

		function stopTimer()
		{
			if (timer)
			{
				window.clearInterval(timer);
				timer = null;
			}
			tick();
			val = null;
			startTime = null;
			button.html(lang._('start'));
			text.html('');
		}

		function tick()
		{
			if (startTime)
			{
				var diff = getTimestamp() - startTime,
					secs = diff / 3600,
					new_val = getVal(val + secs);
				field.val(number_format(new_val, 2, '.', ''));
				var h = parseInt(new_val, 10),
					m = parseInt((new_val - h) * 60, 10);
				text.html((h ? lang._('hours', h) + ' ' : '') + lang._('minutes', (m > 0 && m < 10) ? '0' + m : m));
			}
		}

		function getVal(val)
		{
			return Math.abs(parseFloat(number_format(val, 2, '.', ''))) || 0;
		}

		function getTimestamp()
		{
			return Math.round(new Date().getTime() / 1000);
		}

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

	});
}(jQuery));