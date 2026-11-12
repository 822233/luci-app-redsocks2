-- Redsocks2 HTTPS CONNECT 多节点管理页面
local fs = require "nixio.fs"
local sys = require "luci.sys"
local uci = require "luci.model.uci".cursor()

-- Ensure an existing single-node installation is migrated before rendering.
sys.call("/etc/init.d/redsocks2 migrate >/dev/null 2>&1")

m = Map("redsocks2", "Redsocks2 - HTTPS 透明代理",
	"管理多个 HTTPS CONNECT 节点。网页测速会通过所选节点实际发起 HTTPS 请求和下载文件，不是 TCP 端口探测。"
)

local function read_test_result(section)
	if not section or not section:match("^[%w_]+$") then
		return nil
	end
	return fs.readfile("/tmp/redsocks2-speedtest-" .. section)
end

local base = m:section(TypedSection, "redsocks2_base", "服务设置")
base.anonymous = true
base.addremove = false

local o = base:option(Flag, "enabled", "启用 HTTPS 透明代理")
o.rmempty = false

o = base:option(ListValue, "loglevel", "日志级别")
o:value("off", "关闭")
o:value("info", "普通")
o:value("debug", "调试")
o.default = "info"

o = base:option(ListValue, "active_node", "当前使用节点")
o.rmempty = false
uci:foreach("redsocks2", "redsocks2_node", function(node)
	o:value(node[".name"], node.name or node.ip or node[".name"])
end)

local all_test = base:option(Button, "_test_all", "节点测速")
all_test.inputtitle = "全部测速"
all_test.inputstyle = "apply"
all_test.write = function()
	sys.call("/bin/sh /usr/bin/redsocks2-speedtest --all >/dev/null 2>&1 &")
end

local ranking = base:option(DummyValue, "_speed_ranking", "网页测速速度排名")
ranking.rawhtml = false
ranking.cfgvalue = function()
	local results = {}
	uci:foreach("redsocks2", "redsocks2_node", function(node)
		local data = read_test_result(node[".name"])
		if data then
			local status, latency, speed, code, tested, message =
				data:match("^([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)")
			if status == "OK" then
				results[#results + 1] = {
					name = node.name or node.ip or node[".name"],
					latency = latency,
					speed = tonumber(speed) or 0,
					tested = tested
				}
			end
		end
	end)
	table.sort(results, function(a, b) return a.speed > b.speed end)
	if #results == 0 then
		return "暂无成功的测速结果。点击“全部测速”后，等待后台测试完成并刷新页面。"
	end
	local lines = {}
	for i, item in ipairs(results) do
		lines[#lines + 1] = string.format("%d. %s  |  %s MB/s  |  延迟 %s ms  |  %s",
			i, item.name, string.format("%.2f", item.speed), item.latency, item.tested)
	end
	return table.concat(lines, "\n")
end

local nodes = m:section(TypedSection, "redsocks2_node", "代理节点列表")
nodes.anonymous = false
nodes.addremove = true
nodes.sortable = true
nodes.template = "cbi/tblsection"

o = nodes:option(Value, "name", "节点名称")
o.rmempty = false
o.placeholder = "例如：香港 01"

o = nodes:option(Value, "ip", "服务器地址")
o.rmempty = false
o.placeholder = "域名或 IP 地址"

o = nodes:option(Value, "port", "端口")
o.datatype = "port"
o.default = "443"
o.rmempty = false

o = nodes:option(Value, "username", "用户名")
o.rmempty = true

o = nodes:option(Value, "password", "密码")
o.password = true
o.rmempty = true

o = nodes:option(DummyValue, "_test_result", "网页测速结果")
o.rawhtml = false
o.cfgvalue = function(self, section)
	local data = read_test_result(section)
	if not data then return "尚未测速" end
	local status, latency, speed, code, tested, message =
		data:match("^([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)|([^|]*)")
	if status == "OK" then
		return string.format("可用 | 延迟 %s ms | 下载 %s MB/s | %s", latency, speed, tested)
	end
	return "不可用 | " .. (message or "网页请求失败") .. " | " .. (tested or "")
end

o = nodes:option(Button, "_test_node", "网页测速")
o.inputtitle = "测速此节点"
o.inputstyle = "apply"
o.write = function(self, section)
	if section and section:match("^[%w_]+$") then
		sys.call("/bin/sh /usr/bin/redsocks2-speedtest " .. section .. " >/dev/null 2>&1 &")
	end
end

local whitelist = m:section(TypedSection, "redsocks2_iptables", "国内地址直连")
whitelist.anonymous = true
whitelist.addremove = false

o = whitelist:option(Flag, "whitelist_enabled", "启用国内 IPv4 网段直连")
o.default = "1"
o.rmempty = false
o.description = "开启后自动下载并每周更新中国大陆 IPv4 网段列表。国内 IPv4 地址直接连接，无需手动准备或维护网段文件。"

m.on_after_commit = function(self)
	sys.call("/etc/init.d/redsocks2 restart >/dev/null 2>&1")
end

return m
