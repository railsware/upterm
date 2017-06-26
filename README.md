[![Join the chat at https://gitter.im/railsware/upterm](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/upterm/Lobby)
[![Build Status](https://travis-ci.org/railsware/upterm.svg?branch=master)](https://travis-ci.org/railsware/upterm)

What Is It?
-----------

Upterm (formerly Black Screen) is an IDE in the world of terminals. Strictly speaking, it's both a
terminal emulator and an *interactive* shell based on [Electron](http://electron.atom.io/).
Also, unlike most of the emulators you can meet nowadays it uses HTML and CSS for its UI (exactly as Atom does),
which means we can [stop misusing unicode characters](https://github.com/vim-airline/vim-airline)
and make a better looking terminal with appropriate tools.

![](README/main.png)

###### Autocompletion

Upterm shows the autocompletion box as you type and tries to be smart about what to suggest.
Often you can find useful additional information on the right side of the autocompletion, e.g. expanded alias value,
command descriptions, value of the previous directory (`cd -`), etc.

###### Compatibility

We aim to be compatible at least with [VT100](https://en.wikipedia.org/wiki/VT100). All the programs (emacs, ssh, vim) should work as expected.

Install
------------

###### MacOS

```bash
brew cask install upterm
```

Beware that the version in Homebrew might be outdated. Visit the [releases](https://github.com/railsware/upterm/releases) page to download the latest version.

###### Linux *(Arch Linux)*
```bash
yaourt -S upterm
```

As with macOS's `brew` install, the AUR may also be outdated. To install the latest version, refer to the [install guide for Linux (Others)](#linux-others).

###### Linux *(Others)*

* `git clone https://github.com/railsware/upterm.git`
* `cd upterm`
* `npm install`
* `npm run pack`
* `sudo ./dist/upterm-*.AppImage` 

###### Windows

Windows is not officially supported at the moment. The [Windows Support](https://github.com/railsware/upterm/issues/800) Issue explains potential experimental support.

Technologies
------------

* [Electron](http://electron.atom.io/)
* [TypeScript](http://www.typescriptlang.org/)
* [ReactJS](https://facebook.github.io/react/)


More Screenshots
----------------

![](README/npm_autocompletion.png)
![](README/error.png)
![](README/top_autocompletion.png)
![](README/json_prettyfier.png)
![](README/vim.png)
![](README/emacs.png)
![](README/htop.png)
![](README/cd.png)

Development Setup
------------

```bash
git clone https://github.com/railsware/upterm.git && cd upterm
npm start
```
Instructions are available for [debugging the application in Visual Studio Code](docs/vscodedebugging.md).

To create a standalone application, execute `npm run pack` in the project directory.

Contributing
------------

See [Contributing Guide](CONTRIBUTING.md).

License
-------

[The MIT License](LICENSE).
