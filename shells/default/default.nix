{pkgs, ...}:
pkgs.mkShell {
  NIX_CONFIG = "extra-experimental-features = nix-command flakes";

  buildInputs = with pkgs; [
    bun
    tmux
    mosh
    fzf
    nixpkgs-fmt
  ];

  shellHook = ''
    echo ""
    echo "tmesh development shell"
    echo ""
    echo "Commands:"
    echo "  bun test          - Run tests"
    echo "  bun run dev       - Run CLI in dev mode"
    echo "  bun x tsc --noEmit - Type check"
    echo "  nix build         - Build the package"
    echo "  nixpkgs-fmt .     - Format Nix files"
    echo ""
  '';
}
