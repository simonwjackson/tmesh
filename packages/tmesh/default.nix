{
  pkgs,
  lib ? pkgs.lib,
  version ? "dev",
  ...
}: let
  pname = "tmesh";

  # Runtime dependencies that need to be available in PATH
  runtimeDeps = with pkgs; [
    bash
    coreutils
    fzf
    mosh
    openssh
    tmux
  ];

  # Build the tmesh CLI using Bun
  tmesh = pkgs.stdenv.mkDerivation {
    inherit pname version;

    # Use the directory as-is without filtering
    src = builtins.path {
      path = ./.;
      name = "tmesh-src";
    };

    nativeBuildInputs = with pkgs; [
      bun
      makeWrapper
    ];

    # Don't strip - it corrupts Bun standalone executables
    dontStrip = true;

    buildPhase = ''
      runHook preBuild

      # Build standalone executables with version injected
      bun build src/cli.ts --compile \
        --define '__VERSION__="${version}"' \
        --outfile=tmesh
      bun build src/server-select.ts --compile --outfile=server-select
      bun build src/app-select.ts --compile --outfile=app-select

      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall

      mkdir -p $out/bin

      # Install the compiled binaries
      install -Dm755 tmesh $out/bin/tmesh
      install -Dm755 server-select $out/bin/server-select
      install -Dm755 app-select $out/bin/app-select

      # Wrap with runtime dependencies
      wrapProgram $out/bin/tmesh \
        --prefix PATH : ${pkgs.lib.makeBinPath runtimeDeps}

      wrapProgram $out/bin/server-select \
        --prefix PATH : ${pkgs.lib.makeBinPath runtimeDeps}

      wrapProgram $out/bin/app-select \
        --prefix PATH : ${pkgs.lib.makeBinPath runtimeDeps}

      runHook postInstall
    '';

    meta = with pkgs.lib; {
      description = "Effortlessly manage tmux sessions across multiple hosts.";
      homepage = "https://github.com/simonwjackson/tmesh";
      license = licenses.gpl2Only;
      platforms = platforms.linux ++ platforms.darwin;
      mainProgram = "tmesh";
    };
  };
in
  tmesh
