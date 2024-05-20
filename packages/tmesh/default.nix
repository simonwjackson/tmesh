{pkgs, ...}:
pkgs.resholve.mkDerivation rec {
  pname = "tmesh";
  version = "unstable";
  src = ./.;

  postPatch = ''
  '';

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    find $src -type f -exec bash -c 'file="$1"; install -Dm 755 "$file" "$out/''${file#$src/}"' -- {} \;

    substituteInPlace $out/bin/choose-session.sh \
      --replace "@tmux" "${pkgs.lib.meta.getExe pkgs.tmux}" \
      --replace "@jq" "${pkgs.lib.meta.getExe pkgs.jq}" \

    substituteInPlace $out/bin/tmesh \
      --replace "mosh " "${pkgs.lib.meta.getExe pkgs.mosh} "

    runHook postInstall
  '';

  solutions = {
    default = {
      scripts = [
        "bin/tmesh"
        "bin/tmesh-server"
        "bin/*.sh"
      ];
      interpreter = "${pkgs.bash}/bin/bash";
      inputs =
        [
          "${placeholder "out"}/bin"
        ]
        ++ (with pkgs; [
          bash
          coreutils
          fd
          findutils
          fzf
          gawk
          gnused
          jq
          mosh
          nettools
          tmux
          yq-go
        ]);
      fake = {
        external = [
          # Make sure we can self reference our scripts
          "choose-host"
          "choose-session"
          "tmesh-server"
        ];
      };
      execer = [
        # resholve cannot verify args from these apps
        "cannot:${pkgs.fd}/bin/fd"
        "cannot:${pkgs.fzf}/bin/fzf"
        "cannot:${pkgs.tmux}/bin/tmux"
        "cannot:${pkgs.yq-go}/bin/yq"
        "cannot:${pkgs.mosh}/bin/mosh"
        "cannot:${placeholder "out"}/bin/tmesh"
      ];
    };
  };

  meta = with pkgs.lib; {
    description = "Effortlessly manage tmux sessions across multiple hosts.";
    homepage = "https://github.com/simonwjackson/tmesh";
    license = licenses.gpl2Only;
    platforms = platforms.linux;
    mainProgram = pname;
  };
}
