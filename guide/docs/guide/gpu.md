# GPU (AMD Oberon / RDNA2)

PCI ID: `1002:13fb`

## Status

- amdgpu loads and drives HDMI output - working
- Hardware video decode and encode (VCN) - working, HEVC encode needs I-frame only, see [VCN](#vcn-hardware-video-decode)

::: tip Required modprobe options for a working display
The known-working distro images ship `/etc/modprobe.d/ps5-amdgpu.conf` with:
```
options amdgpu dpm=0 gpu_recovery=0
```
Ports missing this (seen on an in-progress Fedora build) hit no-video/black-screen bugs. If you're porting a new distro or building from scratch, add this file first before chasing other display issues.
:::

## Boost

::: danger PinkSoup Kernel
If you are using PinkSoup kernel from rmux dont enable boost mode as it will lock clocks to the maximum requiring a full restart to go back to dynamic clocks, and it doesnt increase fps or performance in general!
:::

Default GPU clock is lower than PS5 OS. Use ps5_control to unlock full speed:

```bash
cd ps5-linux-tools
sudo ./ps5_control --fan on
sudo ./ps5_control --boost on
```

Always enable fan alongside boost - this matches PS5 OS behavior.

For heavier loads or if you're chasing higher sustained boost clocks, `--fan max`
runs the fan stronger than plain `on`:

```bash
sudo ./ps5_control --fan max
```

To enable at boot:

```bash
sudo ./install.sh
```

This installs `ps5fan.service` and `ps5boost.service` as systemd units.

## 40 CU Unlock

PS5 units ship with either 36 or 38 active CUs out of 40 total - the remainder are harvested (disabled) in silicon. How many CUs your unit actually has is **hardware-specific**: some consoles physically cap at 38, some have all 40. This also means benchmark scores vary between units. The ps5-linux kernel patch unlocks whichever harvested CUs are present.

**Kernel parameter:** `amdgpu.ps5_cu_unlock=N`

| Value | Behavior |
|---|---|
| 0 | Off (default) |
| 1 | Probe |
| 2 | Unlock SE0/SH0 only |
| 3 | Unlock all harvested CUs |
| 4 | Probe-all |

Without the unlock parameter, dmesg reports the hardware-default active CU count:

```
amdgpu: SE 2, SH per SE 2, CU per SH 10, active_cu_number 36
```

Verify after unlocking:

```
sudo dmesg | grep active_cu_number
```

::: info CU count must match per shader engine
The two shader engines (SE) need the same active CU count for the extras to actually get used, 38 CU (uneven split across SEs) benchmarks identically to 36 CU. If you see graphical glitches after unlocking, try `RADV_DEBUG=nohiz` in Steam launch options first, and 38 CU instead of 40 if that doesn't help.
:::

::: warning Harvested CUs come in pairs, some can be faulty
Disabled CUs are harvested in blocks of two, so a real unit's usable count is always 36, 38, or 40, never an odd number in between. If enabling all 40 causes severe visual artifacts, one of your harvested pairs may be silicon-faulty rather than just yield-disabled. You'll need to trial-and-error which pair by testing 38 with different CUs masked off, there's no known correlation between which pair fails and anything else about the unit.
:::

![Let's go gambling](/images/memes/gambling-cu-unlock.webp)
<p style="text-align:center;font-style:italic">harvested CUs come in pairs, and some pairs are faulty</p>

(2 × 2 × 10 = 40 total physical CUs, 36 active by default on this unit)

To unlock all CUs, add to `cmdline.txt` on the FAT32 USB partition:

```
amdgpu.ps5_cu_unlock=3
```

The patch writes to both the CC register and SPI - both are required for the unlock to actually affect dispatch (verified on BC-250).

Source: [ps5-linux-patches commit 5b0dc56](https://github.com/ps5-linux/ps5-linux-patches/commit/5b0dc56c1b37a01dd813cb0f58cd4ae2fc6ed45a)

### Runtime Unlock via UMR (No Kernel Rebuild)

[UMR](https://gitlab.freedesktop.org/tomstdenis/umr) (the AMD GPU register debugger) can enable the extra CUs at runtime without a kernel patch or rebuild, useful for quickly testing before committing to a kernel-level unlock. Available via AUR on Arch, RPM on Fedora/Bazzite, compile from source on Debian-based distros.

Verify the topology looks unlocked with `umr`, but note the topology output may still show the CUs as disabled even when the runtime unlock is active, check benchmark scores to confirm it actually took effect rather than trusting the topology display alone.

## Underperforming vs BC-250 (open investigation)

Superposition scores land noticeably below the theoretical scaling from BC-250 numbers (PS5 has 36-40 CU vs BC-250's 24, expected ~5700-6450pts scaling linearly, actual scores land closer to 5100-5600 even at 40CU+boost, best so far is 5602 on Gentoo linux using kernel 7.3.0-rc6-PinkSoup with 40CU + without boost). Root cause not confirmed. dmesg does report all 36 CUs detected correctly, so it isn't a detection issue.

![BiggestScore](/public/images/uniengine.png)

At matched CU count and clock, BC-250 consistently beats PS5:

| Config | PS5 (boost mode) | BC-250 |
|---|---|---|
| 36 CU @ ~2200MHz | 5040 pts | 5330 pts |
| 40 CU @ ~2200MHz | 5290 pts | 5530 pts |


![Spider-Man pointing at Spider-Man](/images/memes/spiderman-bc250.webp)
<p style="text-align:center;font-style:italic">same silicon family, same CU count, same clock</p>

Leading theory is boost mode isn't holding a constant clock (non-boost scores track much closer between the two platforms).

::: danger Unconfirmed, caused a black screen on test
One theory floated: `adev->gfx.cu_info.lds_size = 128;` in `amdgpu_device.c`. A tester who tried it got a black screen with no amdgpu driver output after rebuild, root cause unclear. Not a working fix, listed here so nobody re-discovers the same dead end blind.
:::

## VCN / Hardware Video Decode

VCN works since [ps5-linux-patches #38](https://github.com/ps5-linux/ps5-linux-patches/pull/38) (commit `8081cd8`, 8 Oct 2026). It is VCN 2.0 (IP 2.0.3), driven by `vcn_v2_0`.

| What | Status |
|---|---|
| Decode H.264, HEVC Main/Main 10, VP9 Profile 0/2, VC-1 | Working, bit-exact with software |
| Decode MPEG-2 | Working, close but not bit-exact |
| Encode H.264 | Working |
| Encode HEVC, I-frame only | Working |
| Encode HEVC, normal GOP with P-frames | Broken, corrupt chroma at every tested bitrate |
| Decode H.264 High 10, AV1, VP8, Theora, MPEG-4 Part 2 | Not supported by the hardware |

Tested sizes: H.264 up to 4096x2304, HEVC and VP9 up to 8192x4352. H.264 at 4096x4096 is advertised but fails.

### How it works

The PS5 runs AMD's Navi 10 VCN firmware with a small patch. The stock firmware waits for an SMU handshake at boot that the PS5 never answers, so the patch skips it. The patched blob ships in the patches repo as `firmware/amdgpu/ps5_vcn.bin` and is built into the kernel. On `1002:13fb` the driver also turns off VCN doorbells (rings use direct register writes), resets the VCPU before start and after a failed stop, and clears stale ring state before start.

### Getting it

There is no prebuilt release with VCN yet. The newest release is still 7.1.7. Build the kernel yourself from `ps5-linux-patches` at `8081cd8` or newer, see [Kernel Setup](/guide/kernel).

![We have VCN at home](/images/memes/vcn-at-home.webp)
<p style="text-align:center;font-style:italic">no prebuilt release with VCN yet</p>

The repo `.config` sets `CONFIG_EXTRA_FIRMWARE="amdgpu/ps5_vcn.bin"` with `CONFIG_EXTRA_FIRMWARE_DIR="../ps5-linux-patches/firmware"`. That path is relative to the kernel tree, so `linux` and `ps5-linux-patches` must be cloned side by side, exactly like the build steps do it.

Check it after boot:

```bash
vainfo
```

It should list H.264, HEVC, VP9, MPEG-2 and VC-1 decode, plus H.264 and HEVC encode. Install `libva-utils` on Arch or `vainfo` on Debian/Ubuntu.

![vainfo on a PS5 with VCN, Mesa 26.2.4 on kernel 7.2.4](/images/vcn/vainfo.webp)

Decode with ffmpeg:

```bash
ffmpeg -hwaccel vaapi -i input.mkv -f null -
```

Transcode to H.264:

```bash
ffmpeg -hwaccel vaapi -hwaccel_output_format vaapi -i input.mkv -c:v h264_vaapi -b:v 12M output.mkv
```

HEVC encode only comes out clean with I-frames only. With P-frames the chroma is corrupt. Force I-frame only with `-g 1 -bf 0`:

```bash
ffmpeg -hwaccel vaapi -hwaccel_output_format vaapi -i input.mkv -c:v hevc_vaapi -g 1 -bf 0 -b:v 25M output.mkv
```

I-frame only needs a lot more bitrate for the same quality. Use `h264_vaapi` when file size matters.

![This is art, appreciate it](/images/memes/this-is-art-hevc.webp)
<p style="text-align:center;font-style:italic">a real HEVC P-frame encoded on the PS5, 15 dB PSNR</p>

### Browsers and streaming

Firefox uses VCN for video through VAAPI. Tested on Firefox 157 with Mesa 26.2.4: H.264 720p60, 1080p and 4K, HEVC and HEVC Main 10 1080p, and VP9 1080p all played with no errors and at most 2 dropped frames in 20 second clips. Check `about:support`, under Media, to see which codecs Firefox decodes in hardware.

Moonlight streaming from the PS5 works through Sunshine with H.264 VCN encode, see [Game Streaming](/guide/gaming#game-streaming-vr).

### Results

![Drake no and yes](/images/memes/drake-vcn.webp)
<p style="text-align:center;font-style:italic">HEVC Main 10 4K decode, numbers from the table below</p>

CPU use: 100% = one logical CPU. FFmpeg CPU during seconds 2 to 9.5.

| Decode CPU | Size | Software | VCN | VCN frame check |
|---|---|---:|---:|---|
| H.264 Baseline | 720p | 4.35% | 0.54% | 32 exact frames |
| H.264 Main | 1080p | 17.19% | 0.60% | 32 exact frames |
| H.264 High | 1080p | 17.66% | 0.67% | 32 exact frames |
| HEVC Main | 1080p | 29.77% | 0.54% | 32 exact frames |
| HEVC Main 10 | 1080p | 35.12% | 0.47% | 32 exact frames |
| VP9 Profile 0 | 1080p | 19.40% | 0.60% | 32 exact frames |
| VP9 Profile 2 | 1080p | 23.68% | 0.54% | 32 exact frames |
| MPEG-2 Main | 1080p | 7.76% | 0.74% | 57.09 dB, not exact |
| VC-1 Advanced | 720p | 19.67% | 0.87% | 32 exact frames |
| H.264 High | 4K | 66.89% | 1.74% | 32 exact frames |
| HEVC Main 10 | 4K | 83.48% | 1.07% | 12 exact frames |
| VP9 Profile 0 | 4K | 75.12% | 1.14% | 12 exact frames |
| H.264 High 10 | 1080p | 21.47% | n/a | Unsupported |
| AV1 Main | 1080p | 16.99% | n/a | Unsupported |
| Theora | 1080p | 8.96% | n/a | Unsupported |
| VP8 | 1080p | 14.18% | n/a | Unsupported |
| MPEG-4 Part 2 Simple | 1080p | 8.03% | n/a | Unsupported |

| Decode FPS | Size | Software | VCN |
|---|---|---:|---:|
| H.264 Baseline | 720p | 29.7 | 29.4 |
| H.264 Main | 1080p | 29.7 | 29.4 |
| H.264 High | 1080p | 29.7 | 29.4 |
| HEVC Main | 1080p | 29.7 | 29.4 |
| HEVC Main 10 | 1080p | 29.7 | 29.4 |
| VP9 Profile 0 | 1080p | 29.6 | 29.4 |
| VP9 Profile 2 | 1080p | 29.4 | 29.4 |
| MPEG-2 Main | 1080p | 28.8 | 28.5 |
| VC-1 Advanced | 720p | 59.4 | 58.8 |
| H.264 High | 4K | 29.4 | 29.4 |
| HEVC Main 10 | 4K | 30.0 | 30.0 |
| VP9 Profile 0 | 4K | 29.7 | 29.7 |
| H.264 High 10 | 1080p | 29.4 | n/a |
| AV1 Main | 1080p | 30.9 | n/a |
| Theora | 1080p | 21.9 | n/a |
| VP8 | 1080p | 29.7 | n/a |
| MPEG-4 Part 2 Simple | 1080p | 29.7 | n/a |

| Transcode CPU | Size | Mbps target | Software | VCN | VCN output |
|---|---|---:|---:|---:|---|
| H.264 Baseline | 1080p | 12 | 90.12% | 1.00% | Checked |
| H.264 Main | 1080p | 12 | 102.15% | 1.00% | Checked |
| H.264 High | 1080p | 12 | 103.02% | 1.00% | Checked |
| HEVC Main | 1080p | 12 | 292.23% | 0.94% | Corrupt chroma |
| HEVC Main10 | 1080p | 12 | 298.39% | 1.00% | Corrupt chroma |
| H.264 | 1080p | 4 | 87.78% | 0.94% | Checked |
| HEVC | 1080p | 4 | 322.99% | 0.80% | Corrupt chroma |
| H.264 | 1080p | 8 | 95.00% | 0.94% | Checked |
| HEVC | 1080p | 8 | 309.06% | 0.94% | Corrupt chroma |
| H.264 | 1080p | 25 | 118.16% | 1.20% | Checked |
| HEVC | 1080p | 25 | 284.08% | 1.20% | Corrupt chroma |
| H.264 | 4K | 25 | 315.14% | 2.27% | Checked |
| HEVC | 4K | 25 | 419.63% | 1.87% | Corrupt chroma |
| H.264 | 4K | 50 | 356.79% | 2.41% | Checked |
| HEVC | 4K | 50 | 367.30% | 2.14% | Corrupt chroma |

| Transcode FPS | Size | Mbps target | Software | VCN |
|---|---|---:|---:|---:|
| H.264 Baseline | 1080p | 12 | 29.4 | 29.4 |
| H.264 Main | 1080p | 12 | 29.4 | 29.4 |
| H.264 High | 1080p | 12 | 29.4 | 29.4 |
| HEVC Main | 1080p | 12 | 18.4 | 29.4 |
| HEVC Main10 | 1080p | 12 | 15.4 | 29.4 |
| H.264 | 1080p | 4 | 29.4 | 29.4 |
| HEVC | 1080p | 4 | 26.8 | 29.4 |
| H.264 | 1080p | 8 | 29.4 | 29.4 |
| HEVC | 1080p | 8 | 21.4 | 29.4 |
| H.264 | 1080p | 25 | 29.4 | 29.4 |
| HEVC | 1080p | 25 | 14.4 | 29.4 |
| H.264 | 4K | 25 | 29.4 | 29.4 |
| HEVC | 4K | 25 | 8.0 | 29.4 |
| H.264 | 4K | 50 | 29.4 | 29.4 |
| HEVC | 4K | 50 | 6.4 | 29.4 |

| Encode PSNR (dB) | Size | Mbps target | Software | VCN |
|---|---|---:|---:|---:|
| H.264 Baseline | 1080p | 12 | 51.16 | 48.19 |
| H.264 Main | 1080p | 12 | 52.54 | 49.90 |
| H.264 High | 1080p | 12 | 52.20 | 49.90 |
| HEVC Main | 1080p | 12 | 51.76 | 15.46 |
| HEVC Main10 | 1080p | 12 | 52.14 | 15.31 |
| H.264 | 1080p | 4 | 41.66 | 39.68 |
| HEVC | 1080p | 4 | 43.25 | 15.85 |
| H.264 | 1080p | 8 | 47.54 | 45.12 |
| HEVC | 1080p | 8 | 47.98 | 15.61 |
| H.264 | 1080p | 25 | 60.88 | 59.90 |
| HEVC | 1080p | 25 | 60.20 | 15.42 |
| H.264 | 4K | 25 | 45.72 | 42.68 |
| HEVC | 4K | 25 | 47.32 | 15.03 |
| H.264 | 4K | 50 | 53.24 | 51.30 |
| HEVC | 4K | 50 | 53.84 | 15.01 |

| File bitrate (Mbps) | Size | Target | Software | VCN |
|---|---|---:|---:|---:|
| H.264 | 1080p | 4 | 4.08 | 4.01 |
| HEVC | 1080p | 4 | 4.10 | 4.10 |
| H.264 | 1080p | 8 | 8.17 | 8.00 |
| HEVC | 1080p | 8 | 8.20 | 7.96 |
| H.264 | 1080p | 25 | 24.81 | 24.86 |
| HEVC | 1080p | 25 | 25.62 | 24.90 |
| H.264 | 4K | 25 | 25.39 | 24.90 |
| HEVC | 4K | 25 | 25.59 | 25.05 |
| H.264 | 4K | 50 | 50.67 | 49.78 |
| HEVC | 4K | 50 | 51.24 | 49.81 |

| Result key | Meaning |
|---|---|
| CPU scale | 100% = one logical CPU. FFmpeg CPU during seconds 2 to 9.5. |
| FPS | Paced runs, including startup. Not maximum throughput. |
| HEVC VCN encoding | Normal GOP with P-frames. Corrupt chroma at every tested bitrate. I-frame only is clean. |
| PSNR | First 60 encoded frames. Higher = less pixel error. |
| File bitrate | Includes container overhead. |
| Repeat count | Decode and 12 Mbps: two runs. Other bitrates: one run. |
| Exact frames | Decoded pixels match software. |

## VRAM

Default allocation shown in tools is 512MB, but this is **dynamic** - the driver escalates and allocates more as needed. With 16GB shared RAM/VRAM, the GPU can use up to ~12GB in practice.

To set a fixed allocation, edit `vram.txt` on the FAT32 USB partition. The
loader reads this as **hex bytes**, not decimal MB - `strtoull(buf, NULL, 16)`
in `ps5-linux-loader/source/loader.c`. A decimal MB value here silently
mis-sets VRAM to almost nothing (a common cause of black screen on boot).

Default (512MB):

```
20000000
```

| Size | vram.txt value |
|---|---|
| 512MB (default) | `20000000` |
| 1GB | `40000000` |
| 2GB | `80000000` |
| 4GB | `100000000` |
| 8GB | `200000000` |

::: warning What `vram.txt` actually controls
Every VRAM split is dynamic, 512MB is **not** a special "fully dynamic" mode. The `vram.txt` value only sets the *minimum* hard-allocated VRAM, it does not cap the maximum. The real maximum dynamic allocation ceiling is `(vram.txt split) + (leftover RAM not in that split) / 2`, which is why some games that use just over 8GB VRAM (FF7 Remake is a known example) crash with `amdgpu_vm_validate() failed / Not enough memory for command submission` even though "plenty" of RAM is technically free.

**Real fix:** raise the GTT ceiling directly with the `ttm.pages_limit` kernel boot parameter instead of (or alongside) bumping `vram.txt`:

```
ttm.pages_limit = (desired GTT size in GB) * 1024 * 1024 / 4
```

Best practice is to leave `vram.txt` at the low default (512MB) and raise `ttm.pages_limit` instead of raising `vram.txt` itself, same effective ceiling without permanently locking that RAM away from the rest of the system when you're not gaming.

Example, 10GB GTT ceiling:

```
ttm.pages_limit=2621440
```
:::

## Equivalent Hardware

| Component | Equivalent |
|---|---|
| GPU | AMD RX 6700 (non-XT) - 36 CU, similar clocks |
| CPU | ~AMD Ryzen 2700 (downclocked Zen 2, 8c/16t) |

## Benchmarks (Superposition 1080p Extreme)

| Config | Score | Notes |
|---|---|---|
| No boost | 4903 | GPU @ 3193 MHz |
| Fan + boost, no CU unlock | ~5150 | |
| 40 CU + fan + boost | 5041 | GPU @ 3493 MHz actual, kernel 7.0.10 |
| 40 CU + fan + boost (CFI-1216A) | 5259 | 6nm APU |
| No CU unlock, no boost | 5367 | kernel 7.3.0-rc6, 40.15 avg fps, highest seen |

BC250 reference: 36CU@2200MHz = ~5336, 40CU@2200MHz = ~5530. Boost mode on PS5 may not always sustain full clock speed depending on thermals.

## Performance Tips

- Remove `idle=halt` from `cmdline.txt` if you notice microstuttering - theflow asked community to test this
- If you see graphical issues in games, set `RADV_DEBUG=nohiz` (same recommendation as AMD BC250). Worth setting this in your shell profile/environment globally rather than per-game, several games have issues without it and it's easy to forget on a fresh Steam library entry
- Many tips from [AMD BC250 Documentation](https://elektricm.github.io/amd-bc250-docs/) apply to PS5 too, but double-check anything VRAM/GTT-allocation related against this page's [VRAM](#vram) section specifically, that page has been reported to have inaccurate/LLM-generated info on how the VRAM split actually works
