#
# Copyright (C) 2008-2014 The LuCI Team
# Apache License, Version 2.0
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Redsocks2 透明代理管理界面
LUCI_DESCRIPTION:=Redsocks2 HTTPS CONNECT（TLS）透明代理，支持多节点和网页测速
LUCI_DEPENDS:=+redsocks2 +curl

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
