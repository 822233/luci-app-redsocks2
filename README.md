# Redsocks2 HTTPS 透明代理（ImmortalWrt 24.10）

这是一个面向 OpenWrt / ImmortalWrt 的轻量级 LuCI 透明代理插件，使用 Redsocks2 将局域网 TCP 连接转发到 TLS 加密的 HTTP CONNECT 代理服务器。

## 功能特点

- 支持 HTTPS CONNECT（TLS）代理，编译时启用 `ENABLE_HTTPS_PROXY=true`
- 支持通过 LuCI 弹窗添加、编辑和删除多个代理节点
- 支持在基本设置中粘贴单个或多条节点分享链接导入；可识别 HTTPS CONNECT 自定义 Base64 地址格式，以及 HTTP CONNECT、SOCKS4、SOCKS5 和受支持的 Shadowsocks URI
- TXT 裸 IP:端口导入使用并发协议握手自动识别 HTTP CONNECT、HTTPS CONNECT、SOCKS4 和 SOCKS5；分享链接按协议头直接解析，不进行探测
- 导入时自动提取节点名称、服务器、端口和认证信息；重复节点去重，不支持的协议会跳过并报告数量
- 可选择当前使用的节点，切换后自动重启代理服务
- 支持代理用户名和密码（可选）
- 支持逐个节点测速或全部节点顺序测速
- 网页可用性测试：通过节点完成 TLS 代理连接、HTTP CONNECT 和 HTTPS GET 请求
- 实际下载测速：经同一节点下载固定大小文件，计算 MB/s，并按速度排序
- 测速不使用 TCP 端口探测；路由器自身发起的测速流量不会被 LAN 透明代理规则再次重定向
- 旧版单节点配置会在首次启动/打开配置页面时自动迁移为“默认节点”
- 使用 nftables 实现透明转发，适配 ImmortalWrt 24.10 / Firewall4
- 支持中国大陆 IPv4 网段自动直连，其他公网 IPv4 TCP 流量通过代理
- 自动下载中国大陆 IPv4 CIDR 列表，默认保存到 `/etc/chnroute.txt`
- 每周自动更新国内 IPv4 列表；下载失败或数据校验失败时保留已有文件，更新成功后自动重载分流规则
- 安装时尝试获取初始列表；服务启动时发现列表缺失会再尝试恢复
- 私有地址、回环地址、链路本地地址、运营商级 NAT 地址和组播地址默认直连
- 不依赖与路由器内核版本绑定的旧版 iptables 内核模块

## 多节点与网页测速

在 LuCI 页面进入“服务 → Redsocks2”：

1. 点击“添加节点”弹出表单，填写名称、协议、服务器地址、端口和可选认证信息；点击“导入分享链接”可粘贴一条或多条分享链接，每行一个。
2. 在“当前使用节点”中选择实际要使用的节点；保存配置后自动重启服务，手动导入节点后也会自动重启。
3. 点击单个节点的“测速此节点”，或点击“全部测速”顺序测试所有节点。
4. 刷新页面查看每个节点的可用状态、网页响应时间和实际下载速度；成功节点会显示速度排名。

网页连通性测试依次尝试 Cloudflare 与 Google 的 204 测试页。下载测速先尝试 Cloudflare 3 MB 测试文件，失败后尝试 OVH 1 MB 文件。测速结果保存在 `/tmp`，路由器重启后会重新测试。所有节点逐个测试，不并发，避免给 MT7981 等低功耗路由器造成过高负载。

测速使用 curl 的 HTTPS 代理模式，并关闭代理服务器证书校验，以匹配当前 Redsocks2 HTTPS CONNECT 核心的证书校验行为。请仅添加可信任的代理服务器。目标网页的 HTTPS 证书仍由 curl 正常校验。

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

## 编译

目标平台：ImmortalWrt 24.10，`mediatek/filogic`，适用于 360 T7（MT7981B）。

需要构建的安装包：

- `redsocks2`：代理转发核心
- `luci-app-redsocks2`：LuCI 图形管理界面（依赖 curl 用于网页测速）

核心依赖 OpenSSL 和启用 OpenSSL 支持的 libevent。上述两个软件包不需要安装额外的内核模块。

仓库已提供 GitHub Actions 自动编译流程，编译产物以 Actions Artifact 形式提供。

## 安全说明

当前 Redsocks2 上游 HTTPS CONNECT 实现没有启用代理服务器证书校验，与小火箭分享链接中的 `allowInsecure=1` 行为相同。测速时也关闭代理服务器证书校验以匹配核心行为；请仅连接可信任的代理服务器。

透明转发规则仅作用于 LAN 接口进入的 IPv4 TCP 流量，默认 LAN 设备名为 `br-lan`。
