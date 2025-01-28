{
  pkgs,
  lib,
  vimUtils,
}:
vimUtils.buildVimPlugin {
  pname = "tmux-session-switcher";
  version = "0.1.0";

  src = ./.;

  meta = with lib; {
    description = "A Neovim plugin for managing tmux sessions";
    # homepage = ""; # TODO: Add your repository URL here
    license = licenses.mit; # Adjust based on your chosen license
    maintainers = []; # Add maintainer info if desired
    platforms = platforms.all;
  };

  dependencies = [
    pkgs.tmux
    pkgs.fd
  ];

  # Ensure plugin files are installed to the correct location
  postInstall = ''
    mkdir -p "$out/lua/tmux-session-switcher"
    cp lua/tmux-session-switcher/*.lua "$out/lua/tmux-session-switcher"
  '';
}
