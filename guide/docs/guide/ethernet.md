# Ethernet

PCI ID: `104d:9104`

Driver: `mts` (MediaTek Star based Gigabit Ethernet)

Works out of the box. No extra setup requried after booting Linux.

## Background

The PS5 GbE controller is based on the MediaTek Star Ethernet MAC (`mtk_star_emac`). The `mts` driver was written by rmuxnet with a base shared by slidybat and endless testing from c0w.

## Kernel Config

```
CONFIG_MTS=y
```

Built-in by default in the ps5-linux kernel. No manual loading neccesary.

## Troubleshooting

If the interface doesn't come up after first boot, disable and re-enable the wired connection in your network manager.

### USB Ethernet Adapters Flaky

If you're using a USB-C or USB-A ethernet adapter instead of the internal port, some users report the connection toggling on/off repeatedly instead of staying stable. No fix identified yet, try a different adapter/cable if you hit this, or use the internal `mts` driver instead, it works on any supported firmware. If buying one, **RTL8156B** is the confirmed-working chipset to look for.

### Speed, CPU Use and IPv6 (Fixed)

Fixed in [ps5-linux-patches #36](https://github.com/ps5-linux/ps5-linux-patches/pull/36) (commit `9322b9d`, 28 Sep 2026). Older kernels had three problems:

- The internal port capped around 300 Mbps while a USB adapter on the same line reached 940-980 Mbps.
- A core got pegged at 100%. The interrupt mask register was written with the wrong polarity and interrupts were only partly acked, so status bits stayed latched and the MSI stopped firing. The driver then lived on a 10 ms fallback poll.
- Inbound IPv6 was dead. The multicast filter was never programmed, so IPv6 neighbor discovery and router adverts were dropped.

![Always has been astronauts](/images/memes/always-has-been-mts.webp)
<p style="text-align:center;font-style:italic">the interrupt mask was written inverted from day one</p>

The fix matches Sony's driver: correct mask polarity, full interrupt ack, the same interrupt moderation timer, a real multicast hash filter and promiscuous mode, and NAPI stopped before DMA on shutdown. RX drop and CRC counters now show up in `ip -s -s link`.

Measured after the fix: 941 Mbps TCP each way, 916 Mbps both ways at once, about 13% of one core at full rate. IPv6 gets a global address through router adverts. Cold boot works.

There is no prebuilt release with this fix yet. The newest release is still 7.1.7. Build from `ps5-linux-patches` at `9322b9d` or newer, see [Kernel Setup](/guide/kernel). Until then, a USB adapter is the fallback for full gigabit on the release kernel.
