-- Redsocks2 配置页面控制器
module("luci.controller.redsocks2", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/redsocks2") then
		return
	end

	entry({"admin", "services", "redsocks2"},
		alias("admin", "services", "redsocks2", "general"),
		"Redsocks2")

	entry({"admin", "services", "redsocks2", "general"},
		cbi("redsocks2/general"),
		"基本设置", 10).leaf = true

	entry({"admin", "services", "redsocks2", "advanced"},
		cbi("redsocks2/advanced"),
		"高级设置", 20).leaf = true
end
