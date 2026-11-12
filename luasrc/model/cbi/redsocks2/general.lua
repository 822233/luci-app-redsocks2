--[[
  LuCI configuration for Redsocks2 HTTPS CONNECT.
  Firewall redirection is managed by the companion init script using nftables.
]]--

m = Map("redsocks2", translate("Redsocks2 - HTTPS Proxy"),
	translate("将局域网 IPv4 TCP 流量通过 TLS 加密的 HTTP CONNECT 代理转发；国内 IPv4 网段可设置为直连。")
)

s = m:section(TypedSection, "redsocks2_base", translate("Service"))
s.anonymous = true
s.addremove = false

o = s:option(Flag, "enabled", translate("Enable HTTPS transparent proxy"))
o.rmempty = false

o = s:option(ListValue, "loglevel", translate("Log Level"))
o:value("off", translate("Off"))
o:value("info", translate("Normal"))
o:value("debug", translate("Debug"))
o.default = "info"

s = m:section(TypedSection, "redsocks2_redirect", translate("HTTPS CONNECT Server"))
s.anonymous = true
s.addremove = false

o = s:option(Value, "ip", translate("Proxy Hostname / IPv4"))
o.description = translate("例如 fan.571589.xyz")
o.rmempty = false

o = s:option(Value, "port", translate("Proxy Port"))
o.datatype = "port"
o.default = "443"
o.rmempty = false

o = s:option(Value, "username", translate("Username"))
o.description = translate("如果代理不需要认证则留空。")

o = s:option(Value, "password", translate("Password"))
o.password = true

s = m:section(TypedSection, "redsocks2_iptables", translate("Domestic Direct Routing"))
s.anonymous = true
s.addremove = false

o = s:option(Flag, "whitelist_enabled", translate("Bypass proxy for domestic IP ranges"))
o.default = "1"
o.rmempty = false

o = s:option(Value, "ipset_whitelist", translate("IPv4 CIDR list path"))
o.default = "/etc/chnroute.txt"
o.description = translate("每行一个 IPv4 网段，例如 1.2.3.0/24；命中列表的目标地址直连。")
o:depends({whitelist_enabled="1"})

m.on_after_commit = function(self)
	luci.sys.call("/etc/init.d/redsocks2 restart >/dev/null 2>&1")
end

return m
