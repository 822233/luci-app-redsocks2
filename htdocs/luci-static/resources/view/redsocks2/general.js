'use strict';
'require view';
'require form';
'require uci';
'require ui';
'require fs';

const PROXY_TYPES = {
	'https-connect': _('HTTPS CONNECT'),
	'http-connect': _('HTTP CONNECT'),
	'socks4': _('SOCKS4'),
	'socks5': _('SOCKS5'),
	'shadowsocks': _('Shadowsocks')
};

return view.extend({
	load: function() {
		return fs.exec('/etc/init.d/redsocks2', [ 'migrate' ])
			.then(function() {
				return uci.load('redsocks2');
			});
	},

	render: function() {
		const m = new form.Map('redsocks2', _('Redsocks2 - 透明代理'),
			_('管理代理服务、节点和国内 IPv4 直连规则。'));

		const base = m.section(form.TypedSection, 'redsocks2_base', _('服务设置'));
		base.anonymous = true;
		base.addremove = false;

		let o = base.option(form.Flag, 'enabled', _('启用透明代理'));
		o.default = '0';
		o.rmempty = false;

		o = base.option(form.ListValue, 'loglevel', _('日志级别'));
		o.value('off', _('关闭'));
		o.value('info', _('普通'));
		o.value('debug', _('调试'));
		o.default = 'info';

		const nodeList = uci.sections('redsocks2', 'redsocks2_node') || [];
		o = base.option(form.ListValue, 'active_node', _('当前使用节点'));
		nodeList.forEach(function(node) {
			o.value(node['.name'], node.name || node.ip || node['.name']);
		});
		o.placeholder = _('请选择节点');
		o.default = nodeList.length ? nodeList[0]['.name'] : '';
		o.rmempty = false;

		const nodes = m.section(form.GridSection, 'redsocks2_node', _('代理节点'));
		nodes.anonymous = true;
		nodes.addremove = true;
		nodes.sortable = true;
		nodes.addbtntitle = _('添加节点');
		nodes.delbtntitle = _('删除节点');
		nodes.modaltitle = function(section_id) {
			const name = uci.get('redsocks2', section_id, 'name') || _('新建节点');
			return _('节点设置：%s').format(name);
		};

		o = nodes.option(form.DummyValue, '_display_name', _('节点名称'));
		o.cfgvalue = function(section_id) {
			return uci.get('redsocks2', section_id, 'name') || _('未命名节点');
		};

		o = nodes.option(form.DummyValue, '_display_type', _('协议'));
		o.cfgvalue = function(section_id) {
			const type = uci.get('redsocks2', section_id, 'proxy_type') || 'https-connect';
			return PROXY_TYPES[type] || type;
		};

		o = nodes.option(form.DummyValue, '_display_endpoint', _('服务器'));
		o.cfgvalue = function(section_id) {
			const host = uci.get('redsocks2', section_id, 'ip') || '';
			const port = uci.get('redsocks2', section_id, 'port') || '';
			return host + (port ? ':' + port : '');
		};

		nodes.tab('basic', _('节点参数'));

		o = nodes.taboption('basic', form.Value, 'name', _('节点名称'));
		o.rmempty = false;
		o.placeholder = _('例如：Romania-02');

		o = nodes.taboption('basic', form.ListValue, 'proxy_type', _('代理协议'));
		Object.keys(PROXY_TYPES).forEach(function(type) {
			o.value(type, PROXY_TYPES[type]);
		});
		o.default = 'https-connect';
		o.rmempty = false;

		o = nodes.taboption('basic', form.Value, 'ip', _('服务器地址'));
		o.rmempty = false;
		o.placeholder = _('域名或 IPv4 地址');

		o = nodes.taboption('basic', form.Value, 'port', _('端口'));
		o.datatype = 'port';
		o.default = '443';
		o.rmempty = false;

		// Ordinary proxy protocols use a username; Shadowsocks uses a cipher.
		// Both are stored in the existing "username" UCI option for core compatibility.
		o = nodes.taboption('basic', form.Value, 'username', _('用户名'));
		o.rmempty = true;
		[ 'https-connect', 'http-connect', 'socks4', 'socks5' ].forEach(function(type) {
			o.depends('proxy_type', type);
		});
		o.description = _('HTTP/HTTPS CONNECT 和 SOCKS 节点的认证用户名。');

		o = nodes.taboption('basic', form.ListValue, 'username', _('Shadowsocks 加密方法'));
		[
			'table', 'rc4', 'rc4-md5', 'aes-128-cfb', 'aes-192-cfb',
			'aes-256-cfb', 'bf-cfb', 'camellia-128-cfb', 'camellia-192-cfb',
			'camellia-256-cfb', 'cast5-cfb', 'des-cfb', 'idea-cfb',
			'rc2-cfb', 'seed-cfb'
		].forEach(function(cipher) {
			o.value(cipher, cipher);
		});
		o.default = 'aes-256-cfb';
		o.rmempty = false;
		o.depends('proxy_type', 'shadowsocks');
		o.description = _('仅显示 Shadowsocks 支持的加密方法，不能手动输入。');

		o = nodes.taboption('basic', form.Value, 'password', _('密码'));
		o.password = true;
		o.rmempty = true;

		const whitelist = m.section(form.TypedSection, 'redsocks2_iptables', _('国内地址直连'));
		whitelist.anonymous = true;
		whitelist.addremove = false;

		o = whitelist.option(form.Flag, 'whitelist_enabled', _('启用国内 IPv4 网段直连'));
		o.default = '1';
		o.rmempty = false;
		o.description = _('自动下载并每周更新中国大陆 IPv4 网段列表。');

		nodes.footer = function() {
			return E('tr', {}, E('td', { 'colspan': 100 }, [
				E('button', {
					'class': 'cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, 'showImportModal')
				}, [ _('导入分享链接') ])
			]));
		}.bind(this);

		return m.render();
	},

	handleSave: function(ev) {
		return this.super('handleSave', [ ev ])
			.then(function() {
				return fs.exec('/sbin/uci', [ 'commit', 'redsocks2' ]);
			})
			.then(function(result) {
				if (result.code !== 0)
					throw new Error(result.stderr || result.stdout || _('保存 Redsocks2 配置失败'));
				return fs.exec('/etc/init.d/redsocks2', [ 'restart' ]);
			})
			.then(function(result) {
				if (result.code !== 0)
					throw new Error(result.stderr || result.stdout || _('代理服务重启失败'));
				ui.addNotification(null, E('p', _('配置已保存，代理服务已重启。')), 'info');
				window.setTimeout(function() {
					window.location.reload();
				}, 600);
			});
	},

	handleSaveApply: function(ev) {
		return this.handleSave(ev);
	},

	showImportModal: function() {
		const textarea = E('textarea', {
			'class': 'cbi-input-textarea',
			'rows': '8',
			'style': 'width:100%; min-height:160px;',
			'placeholder': 'https://MTkzLjE3Ni44NC4zNzo5MDAy?allowInsecure=1#Romania-02'
		});

		ui.showModal(_('导入代理节点'), [
			E('p', {}, _('每行粘贴一个节点分享链接，支持 HTTPS/HTTP CONNECT、SOCKS4、SOCKS5 和 Shadowsocks；不支持订阅网址。')),
			textarea,
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'cbi-button', 'click': ui.hideModal }, [ _('取消') ]),
				' ',
				E('button', {
					'class': 'cbi-button cbi-button-positive important',
					'click': ui.createHandlerFn(this, 'importLinks', textarea)
				}, [ _('导入节点') ])
			])
		], 'cbi-modal');
		textarea.focus();
	},

	importLinks: function(textarea) {
		const content = textarea.value.trim();
		if (!content) {
			ui.addNotification(null, E('p', _('请先粘贴节点分享链接。')), 'warning');
			return;
		}

		return fs.write('/tmp/redsocks2-import.txt', content, 384)
			.then(function() {
				return fs.exec('/usr/bin/redsocks2-subscription', [
					'--file', '/tmp/redsocks2-import.txt'
				]);
			})
			.then(function(result) {
				if (result.code !== 0)
					throw new Error(result.stderr || result.stdout || _('没有可导入的有效节点'));
				ui.hideModal();
				ui.addNotification(null, E('p', result.stdout || _('节点导入成功。')), 'success');
				window.setTimeout(function() {
					window.location.reload();
				}, 800);
			})
			.catch(function(err) {
				ui.addNotification(null, E('p', String(err)), 'error');
			});
	}
});
