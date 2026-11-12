# Redsocks2（LuCI 管理界面）

本项目基于 [hqvv/luci-app-redsocks2](https://github.com/hqvv/luci-app-redsocks2) 修改，提供 Redsocks2 核心程序及 OpenWrt / ImmortalWrt 的 LuCI 管理界面。

## 项目说明

Redsocks2 用于接收被重定向的 TCP 连接，并将其转发到配置的上游代理。配合相应的防火墙转发规则，可以实现透明代理。

本仓库提供两个软件包：

| 软件包 | 作用 |
| --- | --- |
| `redsocks2_*.ipk` | Redsocks2 核心程序，负责实际代理转发 |
| `luci-app-redsocks2_*.ipk` | LuCI 网页管理界面，用于配置和管理核心程序 |

**两个软件包需要配套安装。** 只安装 LuCI 插件不会包含 Redsocks2 核心程序。

## 当前编译版本

当前已提供针对以下环境编译的软件包：

- 固件：ImmortalWrt 24.10
- 目标平台：MediaTek Filogic
- CPU 架构：aarch64 Cortex-A53
- 设备示例：360 T7（MT7981）

> IPK 软件包具有平台和架构要求。其他 OpenWrt / ImmortalWrt 版本或设备不保证兼容，请勿直接混用。

## 下载

请进入本项目的 **Releases** 页面下载已编译的软件包：

[打开 Releases 下载页面](https://github.com/822233/luci-app-redsocks21/releases)

每个版本通常包含：

- `redsocks2_*.ipk`
- `luci-app-redsocks2_*.ipk)

## 安装

将下载的两个 IPK 文件上传到路由器的 `/tmp` 目录，然后通过 SSH 执行：

```sh
opkg install /tmp/redsocks2_*.ipk /tmp/luci-app-redsocks2_*.ipk
```

如果系统提示缺少依赖，请先安装对应依赖包。安装完成后刷新 LuCI 页面，在相应菜单中打开 Redsocks2 管理界面。

## 使用提示

1. 安装核心程序和 LuCI 管理界面。
2. 在 LuCI 页面填写上游代理服务器及端口等参数。
3. 根据实际网络需求配置防火墙重定向规则。
4. 保存并应用配置后，再测试代理连通性。

仅安装软件包不会自动启用透明代理；还需要正确配置上游代理和流量转发规则。

## 自动编译

本仓库使用 GitHub Actions 编译 ImmortalWrt 24.10 / MediaTek Filogic 软件包。

- 工作流支持手动触发。
- 向 `immortalwrt-24.10-https` 分支推送代码时会自动触发编译。
- 仅修改默认分支 `master` 上的项目说明不会触发该编译工作流。

## 上游项目

- 原始 LuCI 项目：[hqvv/luci-app-redsocks2](https://github.com/hqvv/luci-app-redsocks2)
- 本项目：[822233/luci-app-redsocks21](https://github.com/822233/luci-app-redsocks21)
