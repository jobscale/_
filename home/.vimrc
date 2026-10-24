" Common -------------------------------
set nofixendofline      " EOF
set background=dark     " 背景色の傾向(カラースキームがそれに併せて色の明暗を変えてくれる)

" 色
hi Normal ctermfg=LightGray ctermbg=NONE    " 通常
hi NonText ctermfg=DarkBlue                     " EOF以降の~など
hi Comment cterm=Italic ctermfg=LightGreen      " コメント
hi Statement ctermfg=Magenta                    " 命令、分岐
hi Identifier ctermfg=Green                     " 関数、識別子
hi PreProc ctermfg=Yellow                       " プリプロセッサメソッド
hi Type ctermfg=Cyan                            " 型(クラス、構造体)
hi Constant ctermfg=DarkBlue                    " 定数(文字列、文字、数、Boolean)
hi Special ctermfg=LightBlue                    " 特殊記号
hi Conditional ctermfg=Yellow                   " if, not
hi Repeat ctermfg=Yellow                        " for, each
hi Exception ctermfg=DarkYellow                 " try, catch
hi StatusLine ctermbg=Cyan ctermfg=DarkGray     " status bar
hi ZSpace cterm=underline ctermfg=LightBlue     " 全角スペースの定義

let g:hi_insert = 'hi StatusLine ctermbg=Black ctermfg=Blue'

" File
set autoread                            " 更新時自動再読込み
set hidden                              " 編集中でも他のファイルを開けるようにする
set nobackup                            " バックアップを取らない
autocmd BufWritePre * :%s/\s\+$//ge     " 保存時に行末の空白を除去する
match ZSpace /　/                       " 全角スペースの色を変更

" Indent
set tabstop=2 shiftwidth=2 softtabstop=0
set expandtab smartindent noautoindent   " スマートインデント
set noautoindent

" Assist imputting
set backspace=indent,eol,start    " バックスペースで特殊記号も削除可能に
set formatoptions=lmoq            " 整形オプション，マルチバイト系を追加
set whichwrap=b,s,h,s,<,>,[,]     " カーソルを行頭、行末で止まらないようにする

" Complement Command
set wildmenu              " コマンド補完を強化
set wildmode=list:full    " リスト表示，最長マッチ

" Search
set wrapscan              " 最後まで検索したら先頭へ戻る
set ignorecase            " 大文字小文字無視
set smartcase             " 大文字ではじめたら大文字小文字無視しない
set incsearch             " インクリメンタルサーチ
set hlsearch              " 検索文字をハイライト

" View
set showmatch             " 括弧の対応をハイライト
set showcmd               " 入力中のコマンドを表示
set showmode              " 現在のモードを表示
set nowrap                " 画面幅で折り返さない
set list                  " 不可視文字表示
set listchars=tab:>\      " 不可視文字の表示方法
set notitle               " タイトル書き換えない
set scrolloff=3           " 行送り
set display=uhex          " 印字不可能文字を16進数で表示

set statusline=\ %F\ %m\ %r\ %h\ %w\ %{&fileencoding}\ %{&ff}\ ASCII=[\%03.3b]\ HEX=[0x\%02.2B]\ %=\ %l/%v\ \ \ \ [%p%%]\ "
set laststatus=2

if has('syntax')
  augroup InsertHook
    autocmd!
    autocmd InsertEnter * call s:StatusLine('Enter')
    autocmd InsertLeave * call s:StatusLine('Leave')
  augroup END
endif

let s:slhlcmd = ''
function! s:StatusLine(mode)
  if a:mode == 'Enter'
    silent! let s:slhlcmd = 'highlight ' . s:GetHighlight('StatusLine')
    silent exec g:hi_insert
  else
    highlight clear StatusLine
    silent exec s:slhlcmd
  endif
endfunction

function! s:GetHighlight(hi)
  redir => hl
  exec 'highlight '.a:hi
  redir END
  let hl = substitute(hl, '[\r\n]', '', 'g')
  let hl = substitute(hl, 'xxx', '', '')
  return hl
endfunction

if has("autocmd")
  au BufReadPost * if line("'\"") > 1 && line("'\"") <= line("$") | exe "normal! g'\"" | endif
endif

" vim-plugの開始
call plug#begin('~/.vim/plugged')

" 自動整形プラグイン
Plug 'vim-autoformat/vim-autoformat'

" vim-plugの終了
call plug#end()
