-- ============================================
-- Neovim init.lua（Vim設定をLua化＋修正済み）
-- ============================================

vim.opt.mouse = ""
vim.g.mapleader = "f"

-- packer.nvim を読み込む
vim.cmd [[packadd packer.nvim]]

-- packer 設定
require('packer').startup(function(use)
  use 'wbthomason/packer.nvim'
  use 'neovim/nvim-lspconfig'
end)

local lua_ls = vim.lsp.config({
  name = "lua_ls",
  cmd = { "lua-language-server" },
  root_markers = { ".git" },
  settings = {
    Lua = {
      diagnostics = { globals = { "vim" } },
    },
  },
})

vim.lsp.start(lua_ls)

vim.keymap.set("n", "<leader>f", function()
  vim.lsp.buf.format({ async = false })
end)

-- ============================================
-- 基本設定
-- ============================================
local opt = vim.opt

opt.backup = false
opt.hidden = true
opt.autoread = true
opt.background = "dark"

opt.wrap = false
opt.showmatch = true
opt.showcmd = true
opt.showmode = true
opt.list = true
opt.listchars = { tab = ">\\ " }
opt.scrolloff = 3
opt.display = "uhex"

opt.ignorecase = true
opt.smartcase = true
opt.incsearch = true
opt.hlsearch = true

opt.wildmenu = true
opt.wildmode = "list:full"

opt.tabstop = 2
opt.shiftwidth = 2
opt.softtabstop = 0
opt.expandtab = true
opt.smartindent = true

opt.backspace = { "indent", "eol", "start" }
opt.formatoptions = "lmoq"
opt.whichwrap = "b,s,h,l,<,>,[,]"

-- ============================================
-- ハイライト設定
-- ============================================
vim.cmd [[
  hi Normal ctermfg=LightGray ctermbg=NONE
  hi NonText ctermfg=DarkBlue
  hi Comment cterm=Italic ctermfg=LightGreen
  hi Statement ctermfg=Magenta
  hi Identifier ctermfg=Green
  hi PreProc ctermfg=Yellow
  hi Type ctermfg=Cyan
  hi Constant ctermfg=DarkBlue
  hi Special ctermfg=LightBlue
  hi Conditional ctermfg=Yellow
  hi Repeat ctermfg=Yellow
  hi Exception ctermfg=DarkYellow
  hi StatusLine ctermbg=Cyan ctermfg=DarkGray
  hi ZSpace cterm=underline ctermfg=LightBlue
]]

-- 全角スペースの可視化
vim.cmd [[match ZSpace /　/]]

-- ============================================
-- 保存時に行末空白を削除
-- ============================================
vim.api.nvim_create_autocmd("BufWritePre", {
  pattern = "*",
  command = [[%s/\s\+$//e]],
})

-- ============================================
-- 前回のカーソル位置を復元
-- ============================================
vim.api.nvim_create_autocmd("BufReadPost", {
  pattern = "*",
  callback = function()
    local line = vim.fn.line("'\"")
    if line > 1 and line <= vim.fn.line("$") then
      vim.cmd("normal! g'\"")
    end
  end,
})

-- ============================================
-- ステータスライン（関数定義は Lua 外側で行う）
-- ============================================

-- Vimscript 関数を定義（script-local ではなく global にする）
vim.cmd [[
  function! StatusLineGetHighlight(hi)
      redir => hl
      exec 'highlight '.a:hi
      redir END
      let hl = substitute(hl, '[\r\n]', '', 'g')
      let hl = substitute(hl, 'xxx', '', '')
      return hl
  endfunction

  function! StatusLineUpdate(mode)
      if a:mode == 'Enter'
          silent! let g:slhlcmd = 'highlight ' . StatusLineGetHighlight('StatusLine')
          silent exec 'hi StatusLine ctermbg=Black ctermfg=Blue'
      else
          highlight clear StatusLine
          silent exec g:slhlcmd
      endif
  endfunction
]]

-- autocmd は関数定義の後に登録する
vim.cmd [[
  set statusline=\ %F\ %m\ %r\ %h\ %w\ %{&fileencoding}\ %{&ff}\ ASCII=[\%03.3b]\ HEX=[0x\%02.2B]\ %=\ %l/%v\ \ \ \ [%p%%]\
  set laststatus=2

  augroup InsertHook
    autocmd!
    autocmd InsertEnter * call StatusLineUpdate('Enter')
    autocmd InsertLeave * call StatusLineUpdate('Leave')
  augroup END
]]
