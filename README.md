# Audio Programming Resources

A collection of (mostly games-focused) audio programming resources I've developed.

# Contents

## Unreal
- **[Unreal Audio Components (legacy)](/Unreal/exported/UE5%20Audio%20Schematic%20-%20Legacy.pdf):** Diagram covering the primary audio components available in the Unreal engine (before the big UE5 audio updates), and how they interact with each other (pdf)

- **[Unreal Audio Components (UE5 onwards)](/Unreal/exported/UE5%20Audio%20Schematic%20-%20New.pdf):** Diagram covering the primary audio components available in the Unreal engine (after the big UE5 audio updates; i.e. MetaSounds and Audio Modulation), and how they interact with each other (pdf)

**Note:** The PDFs include links to the appropriate Unreal documentation pages for each component, but github's pdf viewer doesn't support links. For that you will need to download the files.

## Interactive Demonstrations of Concepts
A series of interactive demonstrations of digital audio and audio programming concepts, primarily hosted on codepen and archived [here](/Interactive%20Demos). The links below go to the codepen pages for each demonstration:

- **[Interactive Aliasing Demonstration](https://codepen.io/NiallMoody/full/wvamwXM):** Demonstrates aliasing in the audio domain.
- **[Interactive Bit Depth Demonstration](https://codepen.io/NiallMoody/full/bGENBOz):** Demonstrates the impact of bit depth on audio quality, and techniques for minimising correlated noise like dithering and noise shaping.
- **[Digital Filter Demonstration](https://codepen.io/NiallMoody/full/abZmVwq):** Simple audio-visual demonstration of Low Pass, High Pass, and Band Pass filters.
- **[Digital Delay & Ring Buffer Demonstration](https://codepen.io/NiallMoody/full/JjJwwLX):** Visualisation of how digital delays/ring buffers work.
- **[Frequency Perception Demonstration](https://codepen.io/NiallMoody/full/mdxjKmw):** Interactive demonstration of how our perception of frequency is logarithmic, not linear.
- **[Interaural Time Difference Demonstration](https://codepen.io/NiallMoody/full/abKbEdR):** Simple interactive demonstration of the [Interaural Time Difference](https://en.wikipedia.org/wiki/Interaural_time_difference) using short digital delays.

# License
[![CC BY-SA 4.0][cc-by-sa-shield]][cc-by-sa]

This work is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License][cc-by-sa].

[![CC BY-SA 4.0][cc-by-sa-image]][cc-by-sa]

[cc-by-sa]: http://creativecommons.org/licenses/by-sa/4.0/
[cc-by-sa-image]: https://licensebuttons.net/l/by-sa/4.0/88x31.png
[cc-by-sa-shield]: https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg
