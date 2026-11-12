#
# Copyright (C) 2012 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
include $(TOPDIR)/rules.mk

PKG_NAME:=redsocks2
PKG_VERSION:=20170730
PKG_RELEASE:=2
PKG_REV:=3052eeab75ff1ebd20c22334fbbecd808525bca7
PKG_BUILD_DEPENDS:=libevent2 libevent2-openssl libopenssl

PKG_SOURCE_PROTO:=git
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.bz2
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_URL:=https://github.com/semigodking/redsocks.git
PKG_SOURCE_VERSION:=$(PKG_REV)

include $(INCLUDE_DIR)/package.mk

define Package/redsocks2
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  DEPENDS:=+libevent2-openssl +libopenssl
  TITLE:=Redirect TCP connections to SOCKS, HTTP or HTTPS CONNECT proxies
endef

define Package/redsocks2/description
  Redsocks2 with HTTPS CONNECT (TLS) proxy support enabled.
  This package only provides TCP proxying.
endef

MAKE_FLAGS += ENABLE_HTTPS_PROXY=true \
	CFLAGS="$(TARGET_CFLAGS) -I$(STAGING_DIR)/usr/include" \
	LDFLAGS="$(TARGET_LDFLAGS) -L$(STAGING_DIR)/usr/lib"

define Package/redsocks2/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/redsocks2 $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,redsocks2))
