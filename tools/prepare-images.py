"""
Prepara as fotos originais (Fotos-site/) para uso no site.

O que faz:
  - remove o indicador de rolagem do Instagram que ficou na borda direita dos prints;
  - recorta elementos de terceiros (logotipos, capas de livros) quando necessário;
  - gera recortes de detalhe usados no mosaico;
  - grava tudo em src/assets/images/ com nomes descritivos.

A otimização final (AVIF/WebP, vários tamanhos) é feita pelo Astro no build.

Uso:  python tools/prepare-images.py
Para trocar uma foto: substitua o arquivo em src/assets/images/ mantendo o nome,
ou ajuste a tabela SOURCES abaixo e rode o script de novo.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Fotos-site"
OUT = ROOT / "src" / "assets" / "images"
PUBLIC = ROOT / "public"

PREFIX = "WhatsApp Image 2026-10-01 at "
SAFE_RIGHT = 1150  # tudo à direita disso contém o indicador de rolagem do print

# nome de saída: (arquivo original, caixa de recorte (x0, y0, x1, y1) ou None)
SOURCES = {
    # Hero — mesmo look, frente e costas
    "hero-frente": ("22.27.05.jpeg", None),
    "hero-costas": ("22.27.06.jpeg", None),
    # Manifesto
    "arara-halters": ("22.27.08 (2).jpeg", None),
    # Curadoria
    "casual-tee-flores": ("22.27.07.jpeg", (262, 0, SAFE_RIGHT, 1034)),  # corta capas de livros
    "essenciais-halter-renda": ("22.27.07 (1).jpeg", None),
    "conjunto-listrado-andando": ("22.27.08.jpeg", None),
    "ocasiao-cetim-perfil": ("22.27.06 (2).jpeg", None),
    # Experiência
    "detalhe-cetim-cinto": ("22.27.05 (1).jpeg", None),
    # Editorial
    "editorial-cetim": ("22.27.06 (1).jpeg", None),
    # Mosaico
    "conjunto-listrado-frente": ("22.27.08 (1).jpeg", None),
    "tee-verao": ("22.27.07 (2).jpeg", (398, 0, 1010, 921)),  # corta logotipo de terceiros
    "detalhe-renda": ("22.27.08 (2).jpeg", (90, 640, SAFE_RIGHT, 1340)),
    "detalhe-colar": ("22.27.05.jpeg", (300, 150, 860, 800)),
    "detalhe-bolsa": ("22.27.06 (1).jpeg", (300, 760, 880, 1320)),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)

    for name, (file, box) in SOURCES.items():
        im = Image.open(SRC / (PREFIX + file)).convert("RGB")
        w, h = im.size
        im = im.crop(box or (0, 0, min(w, SAFE_RIGHT), h))
        im.save(OUT / f"{name}.jpg", quality=95, subsampling=0)
        print(f"{name:28s} {im.size}")

    # Imagem de compartilhamento (Open Graph) — díptico do hero, 1200x630
    og = Image.new("RGB", (1200, 630), "#f3f0e8")
    for i, name in enumerate(("hero-frente", "hero-costas")):
        panel = ImageOps.fit(
            Image.open(OUT / f"{name}.jpg"), (600, 630), Image.LANCZOS, centering=(0.5, 0.22)
        )
        og.paste(panel, (i * 600, 0))
    og.save(PUBLIC / "og-mab-closet.jpg", quality=86, optimize=True, progressive=True)
    print("og-mab-closet.jpg", og.size)


if __name__ == "__main__":
    main()
