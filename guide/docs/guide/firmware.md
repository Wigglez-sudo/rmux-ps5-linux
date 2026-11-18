# Supported Firmware

::: info Before you ask "when latest fw"
Retail firmware is already past scene numbering `14.xx` (public installer shows something like `26.06-14.10.00`) - the exploit chain is frozen at `13.60`. That gap isn't closing on a schedule. No ETA exists. Asking in Discord won't summon one faster.
:::

<video src="/images/memes/clicked-post.mp4" autoplay loop muted playsinline style="max-width:100%;border-radius:8px"></video>
<p style="text-align:center;font-style:italic">and then he asked "eta when 8.xx" in #general</p>

## Exploitable Versions

| Firmware | M.2 Support | Exploit |
|---|---|---|
| 3.00, 3.10, 3.20, 3.21 | ✗ | Webkit Umtx2 |
| 4.00, 4.02, 4.03, 4.50, 4.51 | ✓ | Webkit Umtx2 |
| 5.00, 5.02, 5.10, 5.50 | ✓ | Webkit Umtx2 |
| 6.00, 6.02, 6.50 | ✓ | Y2JB Lapse  |
| 7.00, 7.01, 7.20, 7.40, 7.60, 7.61 | ✓ | Y2JB Lapse |
| 11.00, 11.20, 11.40, 11.60 | ✓ | Y2JB Relapse / Webkit Relapse |
| 12.00, 12.02, 12.20, 12.40, 12.60, 12.70 | ✓ | Y2JB Relapse / Webkit Relapse |
| 13.00, 13.20, 13.40, 13.42, 13.60 | ✓ | Y2JB Relapse / Webkit Relapse |

::: info Why no M.2 on 3.xx?
The PS5 fails to boot with an M.2 attached on 3.xx firmware.
:::

## Which Firmware Should I Be On?

There is **no performance difference** between any supported firmware version for Linux.

Community recommendations:

| Goal | Recommended firmware |
|---|---|
| No M.2, Linux only | **3.00** - stay as low as possible |
| M.2 + PS5 games + Linux + FPKG| **4.03** - community favorite, full jailbreak support, backports, up to 4TB M.2, FPKG Support |
| M.2 + PS5 games + Linux + FPKG| **5.00-7.61** Fine to stay, no downsides for Linux |
| M.2 + PS5 games + Linux | **8.00-10.60** Update to 11.00-11.60 if you want linux + fpkg asap |
| M.2 + PS5 games + Linux + FPKG| **11.00-11.60** Fine to stay, no downsides for Linux |
| M.2 + PS5 games + Linux | **12.00-13.60** Fine to stay, no downsides for Linux |

## Check Your Firmware

`Settings` → `System` → `System Software` → `System Software Version`

## Updating to a Specific Firmware

Download the correct PUP from [darthsternie.net/ps5-firmwares](https://darthsternie.net/ps5-firmwares/) and follow the [official Sony guide](https://www.playstation.com/en-us/support/hardware/reinstall-playstation-system-software-safe-mode). You cannot downgrade.
