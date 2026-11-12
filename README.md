# luci-app-redsocks2 (ImmortalWrt 24.10 integration)

A lightweight LuCI front end and Redsocks2 TCP redirector for OpenWrt/ImmortalWrt.

## What this fork changes

- Enables the upstream `https-connect` transport at compile time (`ENABLE_HTTPS_PROXY=true`).
- Uses the correct Redsocks2 transport name `https-connect` for TLS-wrapped HTTP CONNECT proxies.
- Includes a LuCI field that accepts a proxy hostname or IPv4 address.
- Replaces the old iptables/ipset startup rules with a dedicated firewall4-compatible nftables table.
- Supports direct routing for private/reserved IPv4 destinations and an optional domestic IPv4 CIDR whitelist.
- Avoids hard dependencies on kernel-version-specific iptables kmod packages.

## Supported use

This build targets TCP traffic. It does not provide UDP proxying, QUIC proxying, or a SOCKS/HTTP UDP associate feature. UDP-based applications may fall back to TCP themselves, but this package does not transparently tunnel UDP.

For a TLS HTTP CONNECT endpoint, select **HTTPS CONNECT (TLS)** in LuCI and enter:
- Proxy server: hostname or IPv4 address
- Port: usually 443
- Username/password: only if required
- Domestic IP whitelist: enable and point to a file containing one IPv4 CIDR per line, for example `1.2.3.0/24`

With a valid China-route CIDR file, matching domestic IPv4 destinations bypass the proxy; other public IPv4 TCP destinations from LAN clients are redirected to the proxy. If the whitelist file is missing or empty, public IPv4 TCP traffic is proxied.

The default whitelist path is `/etc/chnroute.txt`. The file is not bundled; provide and maintain the route list yourself.

## Build

Build both packages in an ImmortalWrt 24.10 SDK matching the router's target:
- `redsocks2`
- `luci-app-redsocks2`

The core package links against `libevent2-openssl` and `libopenssl`. No kernel modules are required by these two packages.

## Security and compatibility notes

The upstream HTTPS CONNECT implementation uses OpenSSL but does not enable peer-certificate verification in this revision. This matches clients configured with `allowInsecure=1`; use only a proxy endpoint you trust.

The nftables redirect applies to LAN ingress on the logical `lan` interface device (normally `br-lan`). It is intentionally IPv4/TCP-only.
