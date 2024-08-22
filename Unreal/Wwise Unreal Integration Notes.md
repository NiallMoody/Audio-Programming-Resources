# Wwise Unreal Integration Notes
If you're planning on integrating Wwise into an Unreal project you'll find that the Wwise Unreal integration includes **a lot** of libraries and binaries for different platforms. I found that integrating a blank Wwise project into Unreal added ~6GB(!) of data to the Unreal project.

In most cases you don't need the majority of those libraries and binaries. I was able to reduce the `Plugins/Wwise` folder to ~170MB by deleting the following folders/files.

## Notes:
1. This worked for my specific use-case. Depending on what you're doing you may well need some of these files. Specifically I needed something that would run in the editor without issue (including with the Wwise profiler), and produce a working **Shipping** build for Windows.
2. I've verified this works for a blueprint-focused project in **Unreal 5.4.3**, using **Wwise 2023.1.4**.
3. Obviously, backup your project before you delete anything.
4. That said, I believe you should be able to replace any deleted files/folders by re-running the integration process from the Wwise launcher.

## List of Files/Folders to Delete:
(all paths are relative to your Unreal project's base directory)

Again: **BACKUP YOUR PROJECT BEFORE DELETING ANYTHING!**

|Path                                                   |Explanation|
|-------------------------------------------------------|-----------|
|Plugins/Wwise/\*.chm									|These are just help files; all of that stuff is online anyway|
|Plugins/Wwise/Binaries/Mac								|Only delete if you have no plan to work on/build for macs|
|Plugins/Wwise/Binaries/Win64/*.pdb						|.pdb files are debugging symbols; unless you're planning on debugging Wwise itself I don't think you need these|
|Plugins/Wwise/ThirdParty/Win32_vc160					|Only necessary if you're planning on producing 32-bit Windows builds|
|Plugins/Wwise/ThirdParty/Win32_vc170					|Only necessary if you're planning on producing 32-bit Windows builds|
|Plugins/Wwise/ThirdParty/WinGC_vc160					|Necessary if you're working with the Microsoft Game Core API|
|Plugins/Wwise/ThirdParty/WinGC_vc170					|Necessary if you're working with the Microsoft Game Core API|
|Plugins/Wwise/ThirdParty/x64_vc160						|Standard 64-bit Windows libraries, but for the older vc160 runtime. If your copy of Visual Studio is up to date you'll be running vc170, and don't need this|
|Plugins/Wwise/ThirdParty/x64_vc170/Debug(StaticCRT)	|Contains an executable called `IntegrationDemo`; seems unnecessary|
|Plugins/Wwise/ThirdParty/x64_vc170/Profile(StaticCRT)	|Contains an executable called `IntegrationDemo`; seems unnecessary|
|Plugins/Wwise/ThirdParty/x64_vc170/Release(StaticCRT)	|Contains an executable called `IntegrationDemo`; seems unnecessary|
|Plugins/Wwise/ThirdParty/x64_vc170/Debug/lib			|You'll need this if you plan on building a Debug build of your game, but otherwise it's not necessary|
|Plugins/Wwise/ThirdParty/x64_vc170/Profile/lib			|You'll need this if you plan on building a Profile build of your game, but otherwise it's not necessary|
|Plugins/Wwise/ThirdParty/x64_vc170/Debug/bin/\*.pdb	|.pdb files are debugging symbols; unless you're planning on debugging Wwise itself I don't think you need these|
|Plugins/Wwise/ThirdParty/x64_vc170/Profile/bin/\*.pdb	|.pdb files are debugging symbols; unless you're planning on debugging Wwise itself I don't think you need these|
|Plugins/Wwise/ThirdParty/x64_vc170/Release/bin/\*.pdb	|.pdb files are debugging symbols; unless you're planning on debugging Wwise itself I don't think you need these|
|Plugins/WwiseNiagara/Binaries/Mac						|Only delete if you have no plan to work on/build for macs|
|Plugins/WwiseNiagara/Binaries/Win64/\*.pdb				|pdb files are debugging symbols; unless you're planning on debugging Wwise itself I don't think you need these|
