# Redsocks2 HTTPS 透明代理（ImmortalWrt 24.10）

这是一个面向 OpenWrt / ImmortalWrt 的轻量级 LuCI 透明代理插件，使用 Redsocks2 将局域网 TCP 连接转发到 TLS 加密的 HTTP CONNECT 代理服务器。

## 功能特点

- 支持 HTTPS CONNECT（TLS）代理，编译时启用 `ENABLE_HTTPS_PROXY=true`
- 代理服务器支持填写域名或 IPv4 地址
- 支持代理用户名和密码（可选）
- 使用 nftables 实现透明转发，适配 ImmortalWrt 24.10 / Firewall4
- 支持中国大陆 IPv4 网段自动直连，其他公网 IPv4 TCP 流量通过代理
- 自动下载中国大陆 IPv4 CIDR 列表，默认保存到 `/etc/chnroute.txt`
- 每周自动更新国内 IPv4 列表；下载失败或数据校验失败时保留已有文件
- 安装时尝试获取初始列表；服务启动时发现列表缺失会再尝试恢复
- 私有地址、回环地址、链路本地地址、运营商级 NAT 地址和组播地址默认直连
- 不依赖与路由器内核版本绑定的旧版 iptables 内核模块

## 国内 IPv4 自动分流

在 LuCI 页面勾选“启用国内 IPv4 网段直连”即可，无需手动下载、填写或维护网段文件。

国内 IPv4 列表来源：[`gaoyifan/china-operator-ip`](https://github.com/gaoyifan/china-operator-ip)，使用其 `ip-lists/china.txt` 预生成 CIDR 列表。上游列表由 GitHub Actions 每日更新。本插件通过 jsDelivr 和 GitHub Raw 两个地址依次尝试下载，并在替换前检查 CIDR 格式及网段数量。

自动更新计划为每周一 04:23（路由器本地时间）。可通过系统日志查看更新结果，日志标签为 `redsocks2-chnroute`。列表更新时间和网段数量分别记录在：

- `/etc/chnroute.last_update`
- `/etc/chnroute.count`

更新失败不会清空或覆盖已有列表。启用国内直连但没有可用列表时，插件会停止添加代理重定向规则，避免把本应直连的国内流量错误地全部送入代理。

## 支持范围与限制

**本插件只代理 IPv4 TCP 流量，不支持 UDP、QUIC，也不提供 UDP 转发功能。** 使用 UDP/QUIC 的应用可能无法通过本插件代理。

当前工作方式：

1. 局域网设备发起 IPv4 TCP 连接。
2. 私有、保留及特殊用途地址直接连接。
3. 命中国内 IPv4 网段列表的目标地址直接连接。
4. 其他公网 IPv4 TCP 连接重定向到本机 Redsocks2，再通过 HTTPS CONNECT 代理转发。

国内 IPv6 流量不由当前 IPv4 网段列表处理；本插件也不提供 IPv6 透明代理。

## 配置说明

在路由器 LuCI 页面进入“服务 → Redsocks2”：

- **启用 HTTPS 透明代理**：勾选后启动透明代理。
- **代理服务器地址**：填写代理域名或 IPv4 地址，例如 `fan.571589.xyz`。
- **代理服务器端口**：通常为 `443`。
- **用户名 / 密码**：代理服务需要认证时填写，否则留空。
- **启用国内 IPv4 网段直连**：建议保持开启，列表由插件自动下载和更新。

## 编译

目标平台：ImmortalWrt 24.10，`mediatek/filogic`，适用于 360 T7（MT7981B）。

需要构建的安装包：

- `redsocks2`：代理转发核心
- `luci-app-redsocks2`：LuCI 图形管理界面

核心依赖 OpenSSL 和启用 OpenSSL 支持的 libevent。上述两个软件包不需要安装额外的内核模块。

仓库已提供 GitHub Actions 自动编译流程，编译产物以 Actions Artifact 形式提供。

## 安全说明

当前采用的上游 HTTPS CONNECT 实现没有启用代理服务器证书校验，与小火箭分享链接中的 `allowInsecure=1` 行为相同。请仅连接可信任的代理服务器。

透明转发规则仅作用于 LAN 接口进入的 IPv4 TCP 流量，默认 LAN 设备名为 `br-lan`。
