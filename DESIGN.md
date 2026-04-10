
# Design System

gray.tab, gray.log, sketchybar-gray-ui에서 추출한 통합 디자인 시스템.

## Philosophy

**Terminal-inspired, minimal, monospace-first.**

- panda css
- Monospace 전용 타이포그래피 (SpaceMono Nerd Font Mono)
- 플랫 디자인, 그라디언트/글로우 없음
- Subtle 애니메이션 (0.1~0.3s)
- 시맨틱 컬러 토큰
- 다크/라이트 멀티 테마 (11종)

## Color System

### Semantic Tokens

모든 테마에서 일관된 이름 사용:

```
Background Layers:  bg, bg2, bg3, bg4
Text:               text, comment
Borders:            border, floatBorder
Semantic:           red, yellow, blue, green, magenta, cyan, orange
Extended:           peach, lime, sky, aqua, coral, emerald, lavender,
                    mint, sapphire, forest, navy, plum, tangerine, gray
```

### Themes (11종)

#### Dark

| Theme | bg | text | blue | green | red |
|-------|-----|------|------|-------|-----|
| Onedark | #1a1a26 | #abb2bf | #61afef | #98c379 | #E06C75 |
| Nord | #2E3440 | #E5E9F0 | #81A1C1 | #A3BE8C | #88C0D0 |
| Tokyo Night | #1a1b26 | #a9b1d6 | #7aa2f7 | #9ece6a | #f7768e |
| Gruvbox Dark | #282828 | #ebdbb2 | #83a598 | #b8bb26 | #fb4934 |
| Ayu Dark | #0B0E14 | #c9c7be | #56c3f9 | #AAD84C | #F07174 |
| GitHub Dark | #24292E | #c9d1d9 | #6AB1F0 | #a5d6ff | #B392E9 |

#### Light

| Theme | bg | text | blue | green | red |
|-------|-----|------|------|-------|-----|
| One Light | #fafafa | #383a42 | #4078f2 | #50a14f | #d84a3d |
| Ayu Light | #fafafa | #5C6166 | #55B4D4 | #86B300 | #F07171 |
| Gruvbox Light | #F2E5BC | #504945 | #076678 | #79740e | #9d0006 |
| Blossom Light | #e6dfdc | #746862 | #b3816a | #6c805c | #8779a8 |
| GitHub Light | #ffffff | #383d42 | #005cc5 | #4c2889 | #5a32a3 |

### Color Usage Rules

- `bg` ~ `bg4`: 깊이 표현 (bg가 가장 뒤, bg4가 가장 앞)
- `text`: 기본 텍스트, `comment`: 보조/비활성 텍스트
- `blue`: 주요 액션, 포커스, 선택 상태
- `green`: 성공, 확인
- `red`: 에러, 삭제, 경고
- `orange`: 활성/선택된 아이템
- `yellow`: 강조
- `magenta`: 보조 액션
- `border`: 기본 구분선, `floatBorder`: 강조 보더

## Typography

```
Font Family:  "SpaceMono Nerd Font Mono", Consolas, monospace
Base Size:    13px
Line Height:  1.5 ~ 1.6
```

### Scale (em 기반, base 13px 기준)

| Token | em | px (approx) | Usage |
|-------|----|-------------|-------|
| 3xs | 0.45 | ~6px | 극소 레이블 |
| 2xs | 0.55 | ~7px | 배지, 힌트 |
| xs | 0.65 | ~8px | 보조 정보 |
| sm | 0.70 | ~9px | 작은 텍스트 |
| md | 0.75 | ~10px | 중간 텍스트 |
| lg | 0.80 | ~10px | 큰 텍스트 |
| xl | 0.85 | ~11px | 제목 |
| base | - | 13px | 본문 기본 |
| body | - | 18px | 큰 본문 |

### Font Weight

- `400`: 본문
- `500`: 키 힌트, 레이블
- `600`: 섹션 제목, 모달 제목
- `700`: 강조, 버튼

## Spacing

4px 기반 그리드:

| Token | Value | Usage |
|-------|-------|-------|
| 0.5 | 2px | 미세 간격 |
| 1 | 4px | 아이콘-텍스트 간격 |
| 1.5 | 6px | 아이콘-레이블 갭 |
| 2 | 8px | 기본 갭, 리스트 아이템 패딩 |
| 2.5 | 10px | - |
| 3 | 12px | 섹션 간격, 카테고리 갭 |
| 4 | 16px | 패널 패딩 |
| 5 | 20px | 메인 콘텐츠 패딩 |
| 6 | 24px | 큰 섹션 간격 |
| 8 | 32px | - |
| 10 | 40px | - |
| 12 | 48px | - |

### Fire-Specific Spacing

```
Window padding:     16px (4)
Input padding:      2px 8px (0.5, 2)
Result item:        8px 12px (2, 3)
Result item gap:    8px (2)
Action bar:         8px 16px (2, 4)
Icon-text gap:      6px (1.5)
Section gap:        12px (3)
```

## Border

### Radius

| Token | Value | Usage |
|-------|-------|-------|
| xs | 2px | 파비콘, 극소 요소 |
| sm | 3px | 인풋, 키 힌트 |
| md | 6px | 패널, 카드 |
| lg | 8px | 메인 윈도우, 모달 |

### Width

- `thin`: 1px (기본 보더)
- `medium`: 2px (활성 상태 좌측 보더)

### Pattern

- 기본: `1px solid var(--border)`
- 활성 아이템: `border-left: 2px solid var(--blue)`
- 포커스: `border-color: var(--blue)`

## Shadows

```
dropdown:     0 4px 12px rgba(0, 0, 0, 0.25)
card:         0 2px 8px rgba(0, 0, 0, 0.15)
```

## Z-Index

| Layer | Value | Usage |
|-------|-------|-------|
| base | 0 | 기본 |
| content | 1 | 콘텐츠 |
| search | 100 | 검색 UI |
| overlay | 200 | 오버레이 |
| top | 300 | 최상위 |

## Animation

### Global Transition

모든 요소에 적용:

```css
transition: background-color 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
```

### Keyframes

| Name | Description | Duration | Easing |
|------|-------------|----------|--------|
| fadeIn | opacity 0 -> 1 | 0.15s | ease |
| slideUp | translateY(8px) + fade | 0.2s | ease |
| scaleIn | scale(0.96) + fade | 0.2s | ease |

### Interaction

| Element | Hover | Active | Duration |
|---------|-------|--------|----------|
| Button | scale(1.02) | scale(0.98) | 0.1s |
| List item | bg -> bg3 | - | 0.2s |
| Toggle | x: +2px | scale(0.98) | 0.1s |
| Input | border-color: blue | - | 0.15s |

## Icon System

Nerd Font 글리프 사용 (SVG 아님):

```
Search:     
Settings:   
Exit:       󰩈
Folder:     
File:       
App:        
Calculator: 
Clipboard:  
Terminal:   
```

Icon-text 갭: 6px, Icon 사이즈: 16px (기본), 14px (소형)

## Component Patterns

### Search Input

```
height:       40px
padding:      2px 8px
background:   var(--bg2)
border:       1px solid var(--border)
border-radius: sm (3px)
font-size:    base (13px)
font-family:  mono
placeholder:  color: var(--comment), opacity: 0.5
focus:        border-color: var(--blue), bg: var(--bg2)
```

### Result Item

```
padding:      8px 12px
border-left:  2px solid transparent
background:   transparent
hover:        bg: var(--bg3)
selected:     border-left-color: var(--blue), bg: var(--bg3)
transition:   all 0.15s ease
gap:          6px (icon to text)
```

### Launcher Window

```
width:        600px (var(--window-width))
max-height:   400px
background:   var(--bg)
border:       1px solid var(--border)
border-radius: lg (8px)
shadow:       0 4px 12px rgba(0, 0, 0, 0.25)
animation:    scaleIn 0.2s ease (on show)
```

### Action Bar

```
padding:      8px 16px
background:   var(--bg2)
border-top:   1px solid var(--border)
font-size:    xs (~8px)
color:        var(--comment)
```

### Key Hint Badge

```
height:       16px
min-width:    28px
padding:      2px 6px
background:   var(--bg)
border:       1px solid var(--border)
border-radius: 3px
font-size:    11px
font-weight:  500
color:        var(--comment)
```

## Scrollbar

```css
width: 6px
track: var(--bg3), border-radius: 2px
thumb: var(--blue), border-radius: 4px
```

## Theme File Format

사용자 테마는 `~/.config/fire/themes/` 에 CSS 파일로 저장:

```css
:root {
  --bg: #1a1a26;
  --bg2: #1F1F2B;
  --bg3: #24242f;
  --bg4: #292934;
  --text: #abb2bf;
  --comment: #565c64;
  --border: #282c34;
  --float-border: #61afef;
  --red: #E06C75;
  --green: #98c379;
  --yellow: #e5c07b;
  --blue: #61afef;
  --magenta: #c678dd;
  --cyan: #56b6c2;
  --orange: #d19a66;
  --radius: 8px;
  --font: "SpaceMono Nerd Font Mono", Consolas, monospace;
  --window-width: 600px;
  --item-height: 40px;
}
```

CSS Variables만 오버라이드하면 전체 UI가 바뀜. 레이아웃, 애니메이션까지 커스터마이징 가능.
