'use strict';
'require view';
'require ui';
'require fs';

return view.extend({
	render: function() {
		var protocol = E('select', { 'id': 'redsocks2-import-protocol', 'class': 'cbi-input-select' }, [
			E('option', { 'value': 'auto' }, _('自动检测（推荐）')),
			E('option', { 'value': 'https-connect' }, _('HTTPS CONNECT')),
			E('option', { 'value': 'http-connect' }, _('HTTP CONNECT')),
			E('option', { 'value': 'socks5' }, _('SOCKS5')),
			E('option', { 'value': 'socks4' }, _('SOCKS4'))
		]);
		var status = E('p', { 'class': 'cbi-section-descr' },
			_('尚未导入。TXT 文件每行填写一个 IP:端口；纯 IP:端口使用并发协议握手自动识别；分享链接直接按协议头识别，不进行探测。'));
		var button;
		button = E('button', {
			'class': 'cbi-button cbi-button-action important',
			'click': function(ev) {
				ev.preventDefault();
				button.disabled = true;
				status.textContent = _('请选择 TXT 文件并上传…');
				ui.uploadFile('/tmp/redsocks2-import.txt', null,
					_('仅上传纯文本节点列表；每行一个 IP:端口。')).then(function(upload) {
					if (!upload || upload.size < 1 || upload.size > 1048576)
						throw new Error(_('文件为空或超过 1 MB'));
					status.textContent = _('文件已上传，正在校验并导入节点…');
					return fs.exec('/usr/bin/redsocks2-subscription', [
						'--file', '/tmp/redsocks2-import.txt', '--type', protocol.value
					]);
				}).then(function(result) {
					if (result.code !== 0)
						throw new Error((result.stderr || result.stdout || _('导入失败')).trim());
					status.textContent = (result.stdout || _('导入完成')).trim();
				}).catch(function(err) {
					status.textContent = _('导入失败：%s').format(err.message || err);
				}).finally(function() {
					button.disabled = false;
				});
			}
		}, _('选择 TXT 文件并导入'));
		return E('div', { 'class': 'cbi-map' }, [
			E('h2', {}, _('Redsocks2 - 批量导入节点')),
			E('p', { 'class': 'cbi-section-descr' },
				_('上传 TXT 文本，支持每行一个 IPv4 地址和端口，例如 161.97.153.238:9050。')),
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'cbi-value' }, [
					E('label', { 'class': 'cbi-value-title', 'for': 'redsocks2-import-protocol' }, _('节点协议')),
					E('div', { 'class': 'cbi-value-field' }, [ protocol ])
				]),
				E('div', { 'class': 'cbi-value' }, [
					E('div', { 'class': 'cbi-value-field' }, [ button ])
				]),
				status
			])
		]);
	}
});
