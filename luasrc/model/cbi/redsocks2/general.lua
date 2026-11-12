-- Redsocks2 HTTPS CONNECT 配置页面
-- 防火墙转发规则由配套服务通过 nftables 管理。

m = Map("redsocks2", "Redsocks2 - HTTPS 透明代理",
	"将局域网 IPv4 TCP 流量通过 TLS 加密的 HTTP CONNECT 代理转发；可设置国内 IPv4 网段直连。"
)

s = m:section(TypedSection, "redsocks2_base", "服务设置")
s.anonymous = true
s.addremove = false

o = s:option(Flag, "enabled", "启用 HTTPS 透明代理")
o.rmempty = false

o = s:option(ListValue, "loglevel", "日志级别")
o:value("off", "关闭")
o:value("info", "普通")
o:value("debug", "调试")
o.default = "info"

s = m:section(TypedSection, "redsocks2_redirect", "HTTPS 代理服务器")
s.anonymous = true
s.addremove = false

o = s:option(Value, "ip", "代理服务器地址")
o.description = "填写代理服务器域名或 IPv4 地址，例如 fan.571589.xyz。"
o.rmempty = false

o = s:option(Value, "port", "代理服务器端口")
o.datatype = "port"
o.default = "443"
o.rmempty = false

o = s:option(Value, "username", "用户名")
o.description = "代理服务器需要身份验证时填写；不需要验证则留空。"

o = s:option(Value, "password", "密码")
o.password = true

s = m:section(TypedSection, "redsocks2_iptables", "国内地址直连")
s.anonymous = true
s.addremove = false

o = s:option(Flag, "whitelist_enabled", "启用国内 IPv4 网段直连")
o.default = "1"
o.rmempty = false
o.description = "开启后自动下载并每周更新中国大陆 IPv4 网段列表。国内 IPv4 地址直接连接，无需手动准备或维护网段文件。"


m.on_after_commit = function(self)
	luci.sys.call("/etc/init.d/redsocks2 restart >/dev/null 2>&1")
end

return m
