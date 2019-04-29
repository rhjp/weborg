import React from 'react'
import ReactDOM from 'react-dom'
import parse from '../parser/index'

const testText = 
`* Configure =use-package=
I use =use-package= to install and configure my packages. My =init.el= includes
the initial setup for =package.el= and ensures that =use-package= is installed,
since I wanna do that right away.

This makes sure that =use-package= will install the package if it's not already
available. It also means that I should be able to open Emacs for the first time
on a fresh Debian box and have my whole environment automatically installed. I'm
not /totally/ sure about that, but we're gettin' close.

#+BEGIN_SRC emacs-lisp
  (require 'use-package-ensure)
  (setq use-package-always-ensure t)
#+END_SRC

Always compile packages, and use the newest version available.

#+BEGIN_SRC emacs-lisp
  (use-package auto-compile
    :config (auto-compile-on-load-mode))

  (setq load-prefer-newer t)
#+END_SRC

* Use sensible-defaults.el

Use [[https://github.com/hrs/sensible-defaults.el][sensible-defaults.el]] for some basic settings.

#+BEGIN_SRC emacs-lisp
  (load-file "~/code/personal/sensible-defaults.el/sensible-defaults.el")
  (sensible-defaults/use-all-settings)
  (sensible-defaults/use-all-keybindings)
  (sensible-defaults/backup-to-temp-directory)
#+END_SRC

* Set personal information

** Who am I? Where am I?

#+BEGIN_SRC emacs-lisp
  (setq user-full-name "Harry R. Schwartz"
        user-mail-address "hello@harryrschwartz.com"
        calendar-latitude 40.00
        calendar-longitude -105.16
        calendar-location-name "Boulder, CO")
#+END_SRC

** Access my netrc data

I store a few credentials in a =.netrc= file. Actually, I think the only creds I
have in there right now are for Instapaper, but this is still a convenient way
to store not-too-terribly-sensitive secrets.

#+BEGIN_SRC emacs-lisp
  (require 'netrc)

  (setq netrc-file "~/.netrc")

  (defun netrc-username (machine)
    "Helper function to extract a username from my netrc."
    (car (netrc-credentials machine)))

  (defun netrc-password (machine)
    "Helper function to extract a password from my netrc."
    (cadr (netrc-credentials machine)))
#+END_SRC

* Add =resources= to =load-path=

#+BEGIN_SRC emacs-lisp
  (add-to-list 'load-path "~/.emacs.d/resources/")
#+END_SRC

* =evil-mode=

I'd prefer not to expand abbrevs when I hit escape. That's always jarring and
usually not what I want. In particular, it makes working with Coq really
frustrating.

#+BEGIN_SRC emacs-lisp
  (setq evil-want-abbrev-expand-on-insert-exit nil)
#+END_SRC

Use =evil=.

#+BEGIN_SRC emacs-lisp
  (use-package evil
    :config
    (evil-mode 1))
#+END_SRC

Enable =surround= everywhere.

#+BEGIN_SRC emacs-lisp
  (use-package evil-surround
    :config
    (global-evil-surround-mode 1))
#+END_SRC

Use =evil= with Org agendas.

#+BEGIN_SRC emacs-lisp
  (use-package evil-org
    :after org
    :config
    (add-hook 'org-mode-hook 'evil-org-mode)
    (add-hook 'evil-org-mode-hook
              (lambda () (evil-org-set-key-theme)))
    (require 'evil-org-agenda)
    (evil-org-agenda-set-keys))
#+END_SRC

* Utility functions

Define a big ol' bunch of handy utility functions.

#+BEGIN_SRC emacs-lisp
  (defun hrs/rename-file (new-name)
    (interactive "FNew name: ")
    (let ((filename (buffer-file-name)))
      (if filename
          (progn
            (when (buffer-modified-p)
               (save-buffer))
            (rename-file filename new-name t)
            (kill-buffer (current-buffer))
            (find-file new-name)
            (message "Renamed '%s' -> '%s'" filename new-name))
        (message "Buffer '%s' isn't backed by a file!" (buffer-name)))))

  (defun hrs/generate-scratch-buffer ()
    "Create and switch to a temporary scratch buffer with a random
       name."
    (interactive)
    (switch-to-buffer (make-temp-name "scratch-")))

  (defun hrs/kill-current-buffer ()
    "Kill the current buffer without prompting."
    (interactive)
    (kill-buffer (current-buffer)))

  (defun hrs/visit-last-migration ()
    "Open the most recent Rails migration. Relies on projectile."
    (interactive)
    (let ((migrations
           (directory-files
            (expand-file-name "db/migrate" (projectile-project-root)) t)))
      (find-file (car (last migrations)))))

  (defun hrs/add-auto-mode (mode &rest patterns)
    (dolist (pattern patterns)
      (add-to-list 'auto-mode-alist (cons pattern mode))))

  (defun hrs/find-file-as-sudo ()
    (interactive)
    (let ((file-name (buffer-file-name)))
      (when file-name
        (find-alternate-file (concat "/sudo::" file-name)))))

  (defun hrs/region-or-word ()
    (if mark-active
        (buffer-substring-no-properties (region-beginning)
                                        (region-end))
      (thing-at-point 'word)))

  (defun hrs/append-to-path (path)
    "Add a path both to the $PATH variable and to Emacs' exec-path."
    (setenv "PATH" (concat (getenv "PATH") ":" path))
    (add-to-list 'exec-path path))
#+END_SRC

* UI preferences
** Tweak window chrome

I don't usually use the menu or scroll bar, and they take up useful space.

#+BEGIN_SRC emacs-lisp
  (tool-bar-mode 0)
  (menu-bar-mode 0)
  (scroll-bar-mode -1)
#+END_SRC

There's a tiny scroll bar that appears in the minibuffer window. This disables
that:

#+BEGIN_SRC emacs-lisp
  (set-window-scroll-bars (minibuffer-window) nil nil)
#+END_SRC

The default frame title isn't useful. This binds it to the name of the current
project:

#+BEGIN_SRC emacs-lisp
  (setq frame-title-format '((:eval (projectile-project-name))))
#+END_SRC

** Use fancy lambdas

Why not?

#+BEGIN_SRC emacs-lisp
  (global-prettify-symbols-mode t)
#+END_SRC

** Load up a theme

I'm currently using the "solarized-light" theme. I've got a scenic wallpaper, so
just a hint of transparency looks lovely and isn't distracting or hard to read.

#+BEGIN_SRC emacs-lisp
  (use-package solarized-theme
    :config
    (load-theme 'solarized-light t)

    (setq solarized-use-variable-pitch nil
          solarized-height-plus-1 1.0
          solarized-height-plus-2 1.0
          solarized-height-plus-3 1.0
          solarized-height-plus-4 1.0)

    (let ((line (face-attribute 'mode-line :underline)))
      (set-face-attribute 'mode-line          nil :overline   line)
      (set-face-attribute 'mode-line-inactive nil :overline   line)
      (set-face-attribute 'mode-line-inactive nil :underline  line)
      (set-face-attribute 'mode-line          nil :box        nil)
      (set-face-attribute 'mode-line-inactive nil :box        nil)
      (set-face-attribute 'mode-line-inactive nil :background "#f9f2d9")))

  (defun transparency (value)
    "Sets the transparency of the frame window. 0=transparent/100=opaque."
    (interactive "nTransparency Value 0 - 100 opaque:")
    (set-frame-parameter (selected-frame) 'alpha value))

  (defun hrs/apply-theme ()
    (interactive)
    (load-theme 'solarized-light t)
    (transparency 70))
#+END_SRC

If this code is being evaluated by =emacs --daemon=, ensure that each subsequent
frame is themed appropriately.

#+BEGIN_SRC emacs-lisp
  (if (daemonp)
      (add-hook 'after-make-frame-functions
                (lambda (frame)
                  (with-selected-frame frame (hrs/apply-theme))))
    (hrs/apply-theme))
#+END_SRC

** Use =moody= for a beautiful modeline

This gives me a truly lovely ribbon-based modeline.

#+BEGIN_SRC emacs-lisp
  (use-package moody
    :config
    (setq x-underline-at-descent-line t)
    (moody-replace-mode-line-buffer-identification)
    (moody-replace-vc-mode))
#+END_SRC

** Use =minions= to hide all minor modes

I never want to see a minor mode, and manually adding =:diminish= to every
use-package declaration is a hassle. This uses =minions= to hide all the minor
modes in the modeline. Nice!

By default there's a =;-)= after the major mode; that's an adorable default, but
I'd rather skip it.

#+BEGIN_SRC emacs-lisp
   (use-package minions
     :config
     (setq minions-mode-line-lighter ""
           minions-mode-line-delimiters '("" . ""))
     (minions-mode 1))
#+END_SRC

** Disable visual bell

=sensible-defaults= replaces the audible bell with a visual one, but I really
don't even want that (and my Emacs/Mac pair renders it poorly). This disables
the bell altogether.

#+BEGIN_SRC emacs-lisp
  (setq ring-bell-function 'ignore)
#+END_SRC

** Scroll conservatively

When point goes outside the window, Emacs usually recenters the buffer point.
I'm not crazy about that. This changes scrolling behavior to only scroll as far
as point goes.

#+BEGIN_SRC emacs-lisp
  (setq scroll-conservatively 100)
#+END_SRC

** Set default font and configure font resizing

I'm partial to Inconsolata.

The standard =text-scale-= functions just resize the text in the current buffer;
I'd generally like to resize the text in /every/ buffer, and I usually want to
change the size of the modeline, too (this is especially helpful when
presenting). These functions and bindings let me resize everything all together!

Note that this overrides the default font-related keybindings from
=sensible-defaults=.

#+BEGIN_SRC emacs-lisp
  (setq hrs/default-font "Inconsolata")
  (setq hrs/default-font-size 8)
  (setq hrs/current-font-size hrs/default-font-size)

  (setq hrs/font-change-increment 1.1)

  (defun hrs/font-code ()
    "Return a string representing the current font (like \"Inconsolata-14\")."
    (concat hrs/default-font "-" (number-to-string hrs/current-font-size)))

  (defun hrs/set-font-size ()
  Set that for the current frame, and also make it the default for
  other, future frames."
    (let ((font-code (hrs/font-code)))
      (add-to-list 'default-frame-alist (cons 'font font-code))
      (set-frame-font font-code)))

  (defun hrs/reset-font-size ()
    (interactive)
    (setq hrs/current-font-size hrs/default-font-size)
    (hrs/set-font-size))

  (defun hrs/increase-font-size ()
    (interactive)
    (setq hrs/current-font-size
          (ceiling (* hrs/current-font-size hrs/font-change-increment)))
    (hrs/set-font-size))

  (defun hrs/decrease-font-size ()
    (interactive)
    (setq hrs/current-font-size
          (max 1
               (floor (/ hrs/current-font-size hrs/font-change-increment))))
    (hrs/set-font-size))

  (define-key global-map (kbd "C-)") 'hrs/reset-font-size)
  (define-key global-map (kbd "C-+") 'hrs/increase-font-size)
  (define-key global-map (kbd "C-=") 'hrs/increase-font-size)
  (define-key global-map (kbd "C-_") 'hrs/decrease-font-size)
  (define-key global-map (kbd "C--") 'hrs/decrease-font-size)

  (hrs/reset-font-size)
#+END_SRC

** Highlight the current line

=global-hl-line-mode= softly highlights the background color of the line
containing point. It makes it a bit easier to find point, and it's useful when
pairing or presenting code.

#+BEGIN_SRC emacs-lisp
  (global-hl-line-mode)
#+END_SRC

** Highlight uncommitted changes

Use the =diff-hl= package to highlight changed-and-uncommitted lines when
programming.

#+BEGIN_SRC emacs-lisp
  (use-package diff-hl
    :config
    (add-hook 'prog-mode-hook 'turn-on-diff-hl-mode)
    (add-hook 'vc-dir-mode-hook 'turn-on-diff-hl-mode))
#+END_SRC

* Project management

I use a few packages in virtually every programming or writing environment to
manage the project, handle auto-completion, search for terms, and deal with
version control. That's all in here.

** =ag=

Set up =ag= for displaying search results.

#+BEGIN_SRC emacs-lisp
  (use-package ag)
#+END_SRC

** =company=

Use =company-mode= everywhere.

#+BEGIN_SRC emacs-lisp
  (use-package company)
  (add-hook 'after-init-hook 'global-company-mode)
#+END_SRC

Use =M-/= for completion.

#+BEGIN_SRC emacs-lisp
  (global-set-key (kbd "M-/") 'company-complete-common)
#+END_SRC

** =dumb-jump=

The =dumb-jump= package works well enough in a [[https://github.com/jacktasia/dumb-jump#supported-languages][ton of environments]], and it
doesn't require any additional setup. I've bound its most useful command to
=M-.=.

#+BEGIN_SRC emacs-lisp
  (use-package dumb-jump
    :config
    (define-key evil-normal-state-map (kbd "M-.") 'dumb-jump-go)
    (setq dumb-jump-selector 'ivy))
#+END_SRC

** =flycheck=

 #+BEGIN_SRC emacs-lisp
   (use-package flycheck)
 #+END_SRC

** =magit=

I use =magit= to handle version control. It's lovely, but I tweak a few things:

- I bring up the status menu with =C-x g=.
- Use =evil= keybindings with =magit=.
- The default behavior of =magit= is to ask before pushing. I haven't had any
  problems with accidentally pushing, so I'd rather not confirm that every time.
- Per [[http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html][tpope's suggestions]], highlight commit text in the summary line that goes
  beyond 50 characters.
- On the command line I'll generally push a new branch with a plain old =git
  push=, which automatically creates a tracking branch on (usually) =origin=.
  Magit, by default, wants me to manually specify an upstream branch. This binds
  =P P= to =magit-push-implicitly=, which is just a wrapper around =git push
  -v=. Convenient!
- I'd like to start in the insert state when writing a commit message.

#+BEGIN_SRC emacs-lisp
  (use-package magit
    :bind
    ("C-x g" . magit-status)

    :config
    (use-package evil-magit)
    (use-package with-editor)
    (setq magit-push-always-verify nil)
    (setq git-commit-summary-max-length 50)

    (with-eval-after-load 'magit-remote
      (magit-define-popup-action 'magit-push-popup ?P
        'magit-push-implicitly--desc
        'magit-push-implicitly ?p t))

    (add-hook 'with-editor-mode-hook 'evil-insert-state))
#+END_SRC

I've been playing around with the newly-released =forge= for managing GitHub PRs
and issues. Seems slick so far.

#+BEGIN_SRC emacs-lisp
  (use-package ghub)
  (use-package forge)
#+END_SRC

** =projectile=

Projectile's default binding of =projectile-ag= to =C-c p s s= is clunky enough
that I rarely use it (and forget it when I need it). This binds it to the
easier-to-type =C-c v= to useful searches.

Bind =C-p= to fuzzy-finding files in the current project. We also need to
explicitly set that in a few other modes.

I use =ivy= as my completion system.

When I visit a project with =projectile-switch-project=, the default action is
to search for a file in that project. I'd rather just open up the top-level
directory of the project in =dired= and find (or create) new files from there.

I'd like to /always/ be able to recursively fuzzy-search for files, not just
when I'm in a Projectile-defined project. I use the current directory as a
project root (if I'm not in a "real" project).

#+BEGIN_SRC emacs-lisp
  (use-package projectile
    :bind
    ("C-c v" . 'projectile-ag)

    :config
    (define-key evil-normal-state-map (kbd "C-p") 'projectile-find-file)
    (evil-define-key 'motion ag-mode-map (kbd "C-p") 'projectile-find-file)
    (evil-define-key 'motion rspec-mode-map (kbd "C-p") 'projectile-find-file)

    (setq projectile-completion-system 'ivy)
    (setq projectile-switch-project-action 'projectile-dired)
    (setq projectile-require-project-root nil))
#+END_SRC

** =undo-tree=

I like tree-based undo management. I only rarely need it, but when I do, oh boy.

#+BEGIN_SRC emacs-lisp
  (use-package undo-tree)
#+END_SRC

* Programming environments

I like shallow indentation, but tabs are displayed as 8 characters by default.
This reduces that.

#+BEGIN_SRC emacs-lisp
  (setq-default tab-width 2)
#+END_SRC

Treating terms in CamelCase symbols as separate words makes editing a little
easier for me, so I like to use =subword-mode= everywhere.

#+BEGIN_SRC emacs-lisp
  (use-package subword
    :config (global-subword-mode 1))
#+END_SRC

Compilation output goes to the =*compilation*= buffer. I rarely have that window
selected, so the compilation output disappears past the bottom of the window.
This automatically scrolls the compilation window so I can always see the
output.

#+BEGIN_SRC emacs-lisp
  (setq compilation-scroll-output t)
#+END_SRC

** Coq

I use =company-coq-mode=, which really helps make Proof General a more useful IDE.

#+BEGIN_SRC emacs-lisp
  (use-package company-coq)
#+END_SRC

I bind the right and left arrow keys to evaluating and retracting the next and
previous statements. This is more convenient than the default bindings of =C-c
C-n= and =C-c C-u=.

I also like to disable =abbrev-mode=; it has a ton of abbreviations for Coq, but
they've always been unpleasant surprises for me.

#+BEGIN_SRC emacs-lisp
  (add-hook 'coq-mode-hook
            (lambda ()
              (company-coq-mode)
              (evil-define-key 'normal coq-mode-map (kbd "<down>") 'proof-assert-next-command-interactive)
              (evil-define-key 'normal coq-mode-map (kbd "<up>") 'proof-undo-last-successful-command)
              (evil-define-key 'normal coq-mode-map (kbd "<return>") 'company-coq-proof-goto-point)
              (abbrev-mode 0)))
#+END_SRC

The default Proof General layout stacks the code, goal, and response buffers on
top of each other. I like to keep my code on one side and my goal and response
buffers on the other.

#+BEGIN_SRC emacs-lisp
  (setq proof-three-window-mode-policy 'hybrid)
#+END_SRC

Don't move point when asserting and undoing proof commands.

#+BEGIN_SRC emacs-lisp
  (setq proof-follow-mode 'ignore)
#+END_SRC

The Proof General splash screen's pretty cute, but I don't need to see it every
time.

#+BEGIN_SRC emacs-lisp
  (setq proof-splash-enable nil)
#+END_SRC

Proof General usually evaluates each comment individually. In literate programs,
this can result in evaluating a /ton/ of comments. This evaluates a series of
consecutive comments as a single comment.

#+BEGIN_SRC emacs-lisp
  (setq proof-script-fly-past-comments t)
#+END_SRC

** CSS, Sass, and Less

Indent by 2 spaces.

#+BEGIN_SRC emacs-lisp
  (use-package css-mode
    :config
    (setq css-indent-offset 2))
#+END_SRC

Don't compile the current SCSS file every time I save.

#+BEGIN_SRC emacs-lisp
  (use-package scss-mode
    :config
    (setq scss-compile-at-save nil))
#+END_SRC

Install Less.

#+BEGIN_SRC emacs-lisp
  (use-package less-css-mode)
#+END_SRC

** Golang

Install =go-mode= and related packages:

#+BEGIN_SRC emacs-lisp
  (use-package go-mode)
  (use-package go-errcheck)
  (use-package company-go)
#+END_SRC

Define my =$GOPATH= and tell Emacs where to find the Go binaries.

#+BEGIN_SRC emacs-lisp
  (setenv "GOPATH" "/home/hrs/code/go")
  (hrs/append-to-path (concat (getenv "GOPATH") "/bin"))
#+END_SRC

Run =goimports= on every file when saving, which formats the file and
automatically updates the list of imports. This requires that the =goimports=
binary be installed.

#+BEGIN_SRC emacs-lisp
  (setq gofmt-command "goimports")
  (add-hook 'before-save-hook 'gofmt-before-save)
#+END_SRC

When I open a Go file,

- Start up =company-mode= with the Go backend. This requires that the =gocode=
  binary is installed,
- Redefine the default =compile= command to something Go-specific, and
- Enable =flycheck=.

#+BEGIN_SRC emacs-lisp
  (add-hook 'go-mode-hook
            (lambda ()
              (set (make-local-variable 'company-backends)
                   '(company-go))
              (company-mode)
              (if (not (string-match "go" compile-command))
                  (set (make-local-variable 'compile-command)
                       "go build -v && go test -v && go vet"))
              (flycheck-mode)))
#+END_SRC

** Haml and Slim

Install the Haml and Slim packages.

#+BEGIN_SRC emacs-lisp
  (use-package haml-mode)
  (use-package slim-mode)
#+END_SRC

If I'm editing Haml or Slim templates I'm probably in a Rails project. In that
case, I'd like to still be able to run my tests from the appropriate buffers.

#+BEGIN_SRC emacs-lisp
  (add-hook 'slim-mode-hook 'rspec-mode)
  (add-hook 'haml-mode-hook 'rspec-mode)
#+END_SRC

** Haskell

#+BEGIN_SRC emacs-lisp
  (use-package haskell-mode)
#+END_SRC

Enable =haskell-doc-mode=, which displays the type signature of a function, and
use smart indentation.

#+BEGIN_SRC emacs-lisp
  (add-hook 'haskell-mode-hook
            (lambda ()
              (haskell-doc-mode)
              (turn-on-haskell-indent)))
#+END_SRC

#+BEGIN_SRC emacs-lisp
  (hrs/append-to-path "~/.cabal/bin")
#+END_SRC

** JavaScript and CoffeeScript

Install =coffee-mode= from editing CoffeeScript code.

#+BEGIN_SRC emacs-lisp
  (use-package coffee-mode)
#+END_SRC

Indent everything by 2 spaces.

#+BEGIN_SRC emacs-lisp
  (setq js-indent-level 2)

  (add-hook 'coffee-mode-hook
            (lambda ()
              (yas-minor-mode 1)
              (setq coffee-tab-width 2)))
#+END_SRC

** Lisps

I like to use =paredit= in Lisp modes to balance parentheses (and more!).

#+BEGIN_SRC emacs-lisp
  (use-package paredit)
#+END_SRC

=rainbow-delimiters= is convenient for coloring matching parentheses.

#+BEGIN_SRC emacs-lisp
  (use-package rainbow-delimiters)
#+END_SRC

All the lisps have some shared features, so we want to do the same things for
all of them. That includes using =paredit=, =rainbow-delimiters=, and
highlighting the whole expression when point is on a parenthesis.

#+BEGIN_SRC emacs-lisp
  (setq lispy-mode-hooks
        '(clojure-mode-hook
          emacs-lisp-mode-hook
          lisp-mode-hook
          scheme-mode-hook))

  (dolist (hook lispy-mode-hooks)
    (add-hook hook (lambda ()
                     (setq show-paren-style 'expression)
                     (paredit-mode)
                     (rainbow-delimiters-mode))))
#+END_SRC

If I'm writing in Emacs lisp I'd like to use =eldoc-mode= to display
documentation.

#+BEGIN_SRC emacs-lisp
  (use-package eldoc
    :config
    (add-hook 'emacs-lisp-mode-hook 'eldoc-mode))
#+END_SRC

I also like using =flycheck-package= to ensure that my Elisp packages are
correctly formatted.

#+BEGIN_SRC emacs-lisp
  (use-package flycheck-package)

  (eval-after-load 'flycheck
    '(flycheck-package-setup))
#+END_SRC

** Python

#+BEGIN_SRC emacs-lisp
  (use-package python-mode)
#+END_SRC

Add =~/.local/bin= to load path. That's where =virtualenv= is installed, and
we'll need that for =jedi=.

#+BEGIN_SRC emacs-lisp
  (hrs/append-to-path "~/.local/bin")
#+END_SRC

Enable =elpy=. This provides automatic indentation, auto-completion, syntax
checking, etc.

#+BEGIN_SRC emacs-lisp
  (use-package elpy)
  (elpy-enable)
#+END_SRC

Use =flycheck= for syntax checking:

#+BEGIN_SRC emacs-lisp
  (add-hook 'elpy-mode-hook 'flycheck-mode)
#+END_SRC

Format code according to PEP8 on save:

#+BEGIN_SRC emacs-lisp
  (use-package py-autopep8)
  (require 'py-autopep8)
  (add-hook 'elpy-mode-hook 'py-autopep8-enable-on-save)
#+END_SRC

Configure Jedi along with the associated =company= mode:

#+BEGIN_SRC emacs-lisp
  (use-package company-jedi)
  (add-to-list 'company-backends 'company-jedi)

  (add-hook 'python-mode-hook 'jedi:setup)
  (setq jedi:complete-on-dot t)
#+END_SRC

** Ruby and RSpec

I use =chruby= to switch between versions of Ruby. This sets a default version
to use within Emacs (for things like =xmp= or =rspec=).

#+BEGIN_SRC emacs-lisp
  (setq hrs/ruby-version "2.5.3")

  (use-package chruby
    :config
    (chruby hrs/ruby-version))
#+END_SRC

Ruby executables are installed in =~/.gem/ruby/<version>/bin=. This ensures that
that's included in the path. In particular, we want that directory to be
included because it contains the =xmpfilter= executable, which is used below.

#+BEGIN_SRC emacs-lisp
  (hrs/append-to-path (format "~/.gem/ruby/%s/bin" hrs/ruby-version))
#+END_SRC

Running tests from within Emacs is awfully convenient.

#+BEGIN_SRC emacs-lisp
  (use-package rspec-mode)
#+END_SRC

=rcodetools= provides =xmp=, which lets me evaluate a Ruby buffer and display
the results in "magic" (=# =>=) comments.

I disable warnings when running code through =xmp= because I disagree with a few
of them (complaining about private =attr_reader=, especially) and they gunk up
my buffer.

#+BEGIN_SRC emacs-lisp
  (setq xmpfilter-command-name
        "ruby -S xmpfilter --no-warnings --dev --fork --detect-rbtest")
  (require 'rcodetools)
#+END_SRC

I like running Rubocop through Flycheck, but it also invokes Reek, which I've
found to be more of a nuisance than a help. This disables the =ruby-reek=
checker:

#+BEGIN_SRC emacs-lisp
  (setq-default flycheck-disabled-checkers '(ruby-reek))
#+END_SRC

When assigning the result of a conditional, I like to align the expression to
match the beginning of the statement instead of indenting it all the way to the
=if=.

#+BEGIN_SRC emacs-lisp
  (setq ruby-align-to-stmt-keywords '(def if))
#+END_SRC

Ruby method comments are often formatted with Yard.

#+BEGIN_SRC emacs-lisp
  (use-package yard-mode)
#+END_SRC

Insert =end= keywords automatically when I start to define a method, class,
module, or block.

#+BEGIN_SRC emacs-lisp
  (use-package ruby-end)
#+END_SRC

Install and enable =projectile-rails= mode in all Rail-related buffers.

#+BEGIN_SRC emacs-lisp
  (use-package projectile-rails
    :config
    (projectile-rails-global-mode))
#+END_SRC

There are a bunch of things I'd like to do when I open a Ruby buffer:

- I don't want to insert an encoding comment.
- I want to enable =yas=, =rspec=, =yard=, =flycheck=, and =projectile-rails=.
- I'd like my RSpec tests to be run in a random order, and I'd like the output
  to be colored.
- Chruby should automatically determine the correct version for me.
- =C-c C-c= should run =xmp=, to do that nifty "eval into comments" trick.

#+BEGIN_SRC emacs-lisp
  (add-hook 'ruby-mode-hook
            (lambda ()
              (setq ruby-insert-encoding-magic-comment nil)
              (yas-minor-mode)
              (rspec-mode)
              (yard-mode)
              (flycheck-mode)
              (local-set-key "\r" 'newline-and-indent)
              (setq rspec-command-options "--color --order random")
              (chruby-use-corresponding)
              (define-key ruby-mode-map (kbd "C-c C-c") 'xmp)))
#+END_SRC

I associate =ruby-mode= with Gemfiles, gemspecs, Rakefiles, and Vagrantfiles.

#+BEGIN_SRC emacs-lisp
  (hrs/add-auto-mode
   'ruby-mode
   "\\Gemfile$"
   "\\.rake$"
   "\\.gemspec$"
   "\\Guardfile$"
   "\\Rakefile$"
   "\\Vagrantfile$"
   "\\Vagrantfile.local$")
#+END_SRC

When running RSpec tests I'd like to scroll to the first error.

#+BEGIN_SRC emacs-lisp
  (add-hook 'rspec-compilation-mode-hook
            (lambda ()
              (make-local-variable 'compilation-scroll-output)
              (setq compilation-scroll-output 'first-error)))
#+END_SRC

** =sh=

Indent with 2 spaces.

#+BEGIN_SRC emacs-lisp
  (add-hook 'sh-mode-hook
            (lambda ()
              (setq sh-basic-offset 2
                    sh-indentation 2)))
#+END_SRC

** Scala

Ensure that =scala-mode= and =sbt-mode= are installed.

#+BEGIN_SRC emacs-lisp
  (use-package scala-mode
    :interpreter
    ("scala" . scala-mode))
  (use-package sbt-mode)
#+END_SRC

Don't show the startup message with launching ENSIME:

#+BEGIN_SRC emacs-lisp
  (setq ensime-startup-notification nil)
#+END_SRC

Bind a few keys to common operations:

#+BEGIN_SRC emacs-lisp
  (evil-define-key 'normal ensime-mode-map (kbd "C-t") 'ensime-type-at-point)
  (evil-define-key 'normal ensime-mode-map (kbd "M-.") 'ensime-edit-definition)
#+END_SRC

** =web-mode=

#+BEGIN_SRC emacs-lisp
  (use-package web-mode)
#+END_SRC

If I'm in =web-mode=, I'd like to:

- Color color-related words with =rainbow-mode=.
- Still be able to run RSpec tests from =web-mode= buffers.
- Indent everything with 2 spaces.

#+BEGIN_SRC emacs-lisp
  (add-hook 'web-mode-hook
            (lambda ()
              (rainbow-mode)
              (rspec-mode)
              (setq web-mode-markup-indent-offset 2)))
#+END_SRC

Use =web-mode= with embedded Ruby files, regular HTML, and PHP.

#+BEGIN_SRC emacs-lisp
  (hrs/add-auto-mode
   'web-mode
   "\\.erb$"
   "\\.html$"
   "\\.php$"
   "\\.rhtml$")
#+END_SRC

** YAML

#+BEGIN_SRC emacs-lisp
  (use-package yaml-mode)
#+END_SRC

If I'm editing YAML I'm usually in a Rails project. I'd like to be able to run
the tests from any buffer.

#+BEGIN_SRC emacs-lisp
  (add-hook 'yaml-mode-hook 'rspec-mode)
#+END_SRC

* Terminal

I use =multi-term= to manage my shell sessions. It's bound to =C-c t=.

#+BEGIN_SRC emacs-lisp
  (use-package multi-term)
  (global-set-key (kbd "C-c t") 'multi-term)
#+END_SRC

Use a login shell:

#+BEGIN_SRC emacs-lisp
  (setq multi-term-program-switches "--login")
#+END_SRC

I'd rather not use Evil in the terminal. It's not especially useful (I don't use
vi bindings in xterm) and it shadows useful keybindings (=C-d= for EOF, for
example).

#+BEGIN_SRC emacs-lisp
  (evil-set-initial-state 'term-mode 'emacs)
#+END_SRC

I add a bunch of hooks to =term-mode=:

- I'd like links (URLs, etc) to be clickable.
- Yanking in =term-mode= doesn't quite work. The text from the paste appears in
  the buffer but isn't sent to the shell process. This correctly binds =C-y= and
  middle-click to yank the way we'd expect.
- I bind =M-o= to quickly change windows. I'd like that in terminals, too.
- I don't want to perform =yasnippet= expansion when tab-completing.

#+BEGIN_SRC emacs-lisp
  (defun hrs/term-paste (&optional string)
    (interactive)
    (process-send-string
     (get-buffer-process (current-buffer))
     (if string string (current-kill 0))))

  (add-hook 'term-mode-hook
            (lambda ()
              (goto-address-mode)
              (define-key term-raw-map (kbd "C-y") 'hrs/term-paste)
              (define-key term-raw-map (kbd "<mouse-2>") 'hrs/term-paste)
              (define-key term-raw-map (kbd "M-o") 'other-window)
              (setq yas-dont-activate t)))
#+END_SRC

* Publishing and task management with Org-mode

#+BEGIN_SRC emacs-lisp
  (use-package org)
#+END_SRC

** Display preferences

I like to see an outline of pretty bullets instead of a list of asterisks.

#+BEGIN_SRC emacs-lisp
  (use-package org-bullets
    :init
    (add-hook 'org-mode-hook 'org-bullets-mode))
#+END_SRC

I like seeing a little downward-pointing arrow instead of the usual ellipsis
(=...=) that org displays when there's stuff under a header.

#+BEGIN_SRC emacs-lisp
  (setq org-ellipsis "⤵")
#+END_SRC

Use syntax highlighting in source blocks while editing.

#+BEGIN_SRC emacs-lisp
  (setq org-src-fontify-natively t)
#+END_SRC

Make TAB act as if it were issued in a buffer of the language's major mode.

#+BEGIN_SRC emacs-lisp
  (setq org-src-tab-acts-natively t)
#+END_SRC

When editing a code snippet, use the current window rather than popping open a
new one (which shows the same information).

#+BEGIN_SRC emacs-lisp
  (setq org-src-window-setup 'current-window)
#+END_SRC

Quickly insert a block of elisp:

#+BEGIN_SRC emacs-lisp
  (add-to-list 'org-structure-template-alist
               '("el" . "src emacs-lisp"))
#+END_SRC

** Task and org-capture management

Store my org files in =~/documents/org=, maintain an inbox in Dropbox, define
the location of an index file (my main todo list), and archive finished tasks in
=~/documents/org/archive.org=.

#+BEGIN_SRC emacs-lisp
  (setq org-directory "~/documents/org")

  (defun org-file-path (filename)
    "Return the absolute address of an org file, given its relative name."
    (concat (file-name-as-directory org-directory) filename))

  (setq org-inbox-file "~/Dropbox/inbox.org")
  (setq org-index-file (org-file-path "index.org"))
  (setq org-archive-location
        (concat (org-file-path "archive.org") "::* From %s"))
#+END_SRC

I use [[http://agiletortoise.com/drafts/][Drafts]] to create new tasks, format them according to a template, and
append them to an "inbox.org" file in my Dropbox. This function lets me import
them easily from that inbox file to my index.

#+BEGIN_SRC emacs-lisp
  (defun hrs/copy-tasks-from-inbox ()
    (when (file-exists-p org-inbox-file)
      (save-excursion
        (find-file org-index-file)
        (goto-char (point-max))
        (insert-file-contents org-inbox-file)
        (delete-file org-inbox-file))))
#+END_SRC

I store all my todos in =~/documents/org/index.org=, so I'd like to derive my
agenda from there.

#+BEGIN_SRC emacs-lisp
  (setq org-agenda-files (list org-index-file))
#+END_SRC

Hitting =C-c C-x C-s= will mark a todo as done and move it to an appropriate
place in the archive.

#+BEGIN_SRC emacs-lisp
  (defun hrs/mark-done-and-archive ()
    "Mark the state of an org-mode item as DONE and archive it."
    (interactive)
    (org-todo 'done)
    (org-archive-subtree))

  (define-key org-mode-map (kbd "C-c C-x C-s") 'hrs/mark-done-and-archive)
#+END_SRC

Record the time that a todo was archived.

#+BEGIN_SRC emacs-lisp
  (setq org-log-done 'time)
#+END_SRC

**** Capturing tasks

Define a few common tasks as capture templates. Specifically, I frequently:

- Record ideas for future blog posts in =~/documents/notes/blog-ideas.org=,
- Maintain a todo list in =~/documents/org/index.org=.
- Convert emails into todos to maintain an empty inbox.

#+BEGIN_SRC emacs-lisp
  (setq org-capture-templates
        '(("b" "Blog idea"
           entry
           (file "~/documents/notes/blog-ideas.org")
           "* %?\n")

          ("e" "Email" entry
           (file+headline org-index-file "Inbox")
           "* TODO %?\n\n%a\n\n")

          ("f" "Finished book"
           table-line (file "~/documents/notes/books-read.org")
           "| %^{Title} | %^{Author} | %u |")

          ("r" "Reading"
           checkitem
           (file (org-file-path "to-read.org")))

          ("s" "Subscribe to an RSS feed"
           plain
           (file "~/documents/rss/urls")
           "%^{Feed URL} \"~%^{Feed name}\"")

          ("t" "Todo"
           entry
           (file+headline org-index-file "Inbox")
           "* TODO %?\n")))
#+END_SRC

When I'm starting an Org capture template I'd like to begin in insert mode. I'm
opening it up in order to start typing something, so this skips a step.

#+BEGIN_SRC emacs-lisp
  (add-hook 'org-capture-mode-hook 'evil-insert-state)
#+END_SRC

Refiling according to the document's hierarchy.

#+BEGIN_SRC emacs-lisp
  (setq org-refile-use-outline-path t)
  (setq org-outline-path-complete-in-steps nil)
#+END_SRC

**** Keybindings

Bind a few handy keys.

#+BEGIN_SRC emacs-lisp
  (define-key global-map "\C-cl" 'org-store-link)
  (define-key global-map "\C-ca" 'org-agenda)
  (define-key global-map "\C-cc" 'org-capture)
#+END_SRC

Hit =C-c i= to quickly open up my todo list.

#+BEGIN_SRC emacs-lisp
  (defun hrs/open-index-file ()
    "Open the master org TODO list."
    (interactive)
    (hrs/copy-tasks-from-inbox)
    (find-file org-index-file)
    (flycheck-mode -1)
    (end-of-buffer))

  (global-set-key (kbd "C-c i") 'hrs/open-index-file)
#+END_SRC

Hit =M-n= to quickly open up a capture template for a new todo.

#+BEGIN_SRC emacs-lisp
  (defun org-capture-todo ()
    (interactive)
    (org-capture :keys "t"))

  (global-set-key (kbd "M-n") 'org-capture-todo)
  (add-hook 'gfm-mode-hook
            (lambda () (local-set-key (kbd "M-n") 'org-capture-todo)))
  (add-hook 'haskell-mode-hook
            (lambda () (local-set-key (kbd "M-n") 'org-capture-todo)))
#+END_SRC

** Exporting

Allow export to markdown and beamer (for presentations).

#+BEGIN_SRC emacs-lisp
  (require 'ox-md)
  (require 'ox-beamer)
#+END_SRC

Allow =babel= to evaluate Emacs lisp, Ruby, dot, or Gnuplot code.

#+BEGIN_SRC emacs-lisp
  (use-package gnuplot)

  (org-babel-do-load-languages
   'org-babel-load-languages
   '((emacs-lisp . t)
     (ruby . t)
     (dot . t)
     (gnuplot . t)))
#+END_SRC

Don't ask before evaluating code blocks.

#+BEGIN_SRC emacs-lisp
  (setq org-confirm-babel-evaluate nil)
#+END_SRC

Associate the "dot" language with the =graphviz-dot= major mode.

#+BEGIN_SRC emacs-lisp
  (use-package graphviz-dot-mode)
  (add-to-list 'org-src-lang-modes '("dot" . graphviz-dot))
#+END_SRC

Translate regular ol' straight quotes to typographically-correct curly quotes
when exporting.

#+BEGIN_SRC emacs-lisp
  (setq org-export-with-smart-quotes t)
#+END_SRC

**** Exporting to HTML

Don't include a footer with my contact and publishing information at the bottom
of every exported HTML document.

#+BEGIN_SRC emacs-lisp
  (setq org-html-postamble nil)
#+END_SRC

Exporting to HTML and opening the results triggers =/usr/bin/sensible-browser=,
which checks the =$BROWSER= environment variable to choose the right browser.
I'd like to always use Firefox, so:

#+BEGIN_SRC emacs-lisp
  (setq browse-url-browser-function 'browse-url-generic
        browse-url-generic-program "firefox")

  (setenv "BROWSER" "firefox")
#+END_SRC

**** Exporting to PDF

I want to produce PDFs with syntax highlighting in the code. The best way to do
that seems to be with the =minted= package, but that package shells out to
=pygments= to do the actual work. =pdflatex= usually disallows shell commands;
this enables that.

#+BEGIN_SRC emacs-lisp
  (setq org-latex-pdf-process
        '("xelatex -shell-escape -interaction nonstopmode -output-directory %o %f"
          "xelatex -shell-escape -interaction nonstopmode -output-directory %o %f"
          "xelatex -shell-escape -interaction nonstopmode -output-directory %o %f"))
#+END_SRC

Include the =minted= package in all of my LaTeX exports.

#+BEGIN_SRC emacs-lisp
  (add-to-list 'org-latex-packages-alist '("" "minted"))
  (setq org-latex-listings 'minted)
#+END_SRC

**** Exporting projects

I have a few Org project definitions that I maintain in a separate elisp file.

#+BEGIN_SRC emacs-lisp
  (load-file ".emacs.d/projects.el")
#+END_SRC

** TeX configuration

I rarely write LaTeX directly any more, but I often export through it with
org-mode, so I'm keeping them together.

Automatically parse the file after loading it.

#+BEGIN_SRC emacs-lisp
  (setq TeX-parse-self t)
#+END_SRC

Always use =pdflatex= when compiling LaTeX documents. I don't really have any
use for DVIs.

#+BEGIN_SRC emacs-lisp
  (setq TeX-PDF-mode t)
#+END_SRC

Open compiled PDFs in =zathura= instead of in the editor.

#+BEGIN_SRC emacs-lisp
  (add-hook 'org-mode-hook
        '(lambda ()
           (delete '("\\.pdf\\'" . default) org-file-apps)
           (add-to-list 'org-file-apps '("\\.pdf\\'" . "zathura %s"))))
#+END_SRC

Enable a minor mode for dealing with math (it adds a few useful keybindings),
and always treat the current file as the "main" file. That's intentional, since
I'm usually actually in an org document.

#+BEGIN_SRC emacs-lisp
  (add-hook 'LaTeX-mode-hook
            (lambda ()
              (LaTeX-math-mode)
              (setq TeX-master t)))
#+END_SRC

** Add links to Instapaper

I sometimes use [[https://instapaper.com][Instapaper]] to store articles I want to read later. The
=instapaper.el= library sends my URLs there.

#+BEGIN_SRC emacs-lisp
  (use-package instapaper)
  (require 'instapaper)

  (setq instapaper-username (netrc-username "instapaper.com")
        instapaper-password (netrc-password "instapaper.com"))
#+END_SRC

* Blogging

I maintain a blog written in Jekyll. There are plenty of command-line tools to
automate creating a new post, but staying in my editor minimizes friction and
encourages me to write.

This defines a =hrs/new-blog-post= function, which prompts the user for a title
and creates a new post (with a timestamped and slugged file name) in the blog's
=_posts/= directory. The new post includes appropriate YAML header information.

#+BEGIN_SRC emacs-lisp
  (defvar hrs/jekyll-posts-directory "~/documents/blog/_posts/")
  (defvar hrs/jekyll-post-extension ".md")

  (defun hrs/replace-whitespace-with-hyphens (s)
    (replace-regexp-in-string " " "-" s))

  (defun hrs/replace-nonalphanumeric-with-whitespace (s)
    (replace-regexp-in-string "[^A-Za-z0-9 ]" " " s))

  (defun hrs/remove-quotes (s)
    (replace-regexp-in-string "[\'\"]" "" s))

  (defun hrs/replace-unusual-characters (title)
    "Remove quotes, downcase everything, and replace characters
  that aren't alphanumeric with hyphens."
    (hrs/replace-whitespace-with-hyphens
     (s-trim
      (downcase
       (hrs/replace-nonalphanumeric-with-whitespace
        (hrs/remove-quotes title))))))

  (defun hrs/slug-for (title)
    "Given a blog post title, return a convenient URL slug.
     Downcase letters and remove special characters."
    (let ((slug (hrs/replace-unusual-characters title)))
      (while (string-match "--" slug)
        (setq slug (replace-regexp-in-string "--" "-" slug)))
      slug))

  (defun hrs/timestamped-slug-for (title)
    "Turn a string into a slug with a timestamp and title."
    (concat (format-time-string "%Y-%m-%d")
            "-"
            (hrs/slug-for title)))

  (defun hrs/jekyll-yaml-template (title)
    "Return the YAML header information appropriate for a blog
     post. Include the title, the current date, the post layout,
     and an empty list of tags."
    (concat
     "---\n"
     "title: " title "\n"
     "date: " (format-time-string "%Y-%m-%d") "\n"
     "layout: post\n"
     "# pdf_file: " (hrs/slug-for title) ".pdf\n"
     "tags: []\n"
     "---\n\n"))

  (defun hrs/new-blog-post (title)
    "Create a new blog post in Jekyll."
    (interactive "sPost title: ")
    (let ((post (concat hrs/jekyll-posts-directory
                        (hrs/timestamped-slug-for title)
                        hrs/jekyll-post-extension)))
      (if (file-exists-p post)
          (find-file post)
        (find-file post)
        (insert (hrs/jekyll-yaml-template title)))))
#+END_SRC

This selects and inserts a tag:

#+BEGIN_SRC emacs-lisp
  (defun hrs/existing-blog-tags ()
    "Return a list of all the tags currently used in my blog."
    (split-string (shell-command-to-string "cd ~/documents/blog && rake tags")))

  (defun hrs/insert-blog-tag ()
    "Select one of the current tags and insert it at point."
    (interactive)
    (insert
     (ivy-completing-read "Insert tag at point: " (hrs/existing-blog-tags))))
#+END_SRC

* Daily checklist

There are certain things I want to do regularly. I store those in a checklist.
Because different things happen on different days, the checklist is an Org
document generated by a Ruby script.

Running =hrs/today= either opens today's existing checklist (if it exists), or
renders today's new checklist, copies it into an Org file in =/tmp=, and opens
it.

#+BEGIN_SRC emacs-lisp
  (setq hrs/checklist-script "~/bin/daily-checklist")

  (defun hrs/today-checklist-filename ()
    "The filename of today's checklist."
    (concat "/home/hrs/documents/checklists/daily-checklist-" (format-time-string "%Y-%m-%d") ".org"))

  (defun hrs/today ()
    "Take a look at today's checklist."
    (interactive)
    (let ((filename (hrs/today-checklist-filename)))
      (if (file-exists-p filename)
          (find-file filename)
        (progn
          (shell-command (concat hrs/checklist-script " > " filename))
          (find-file filename)))))
#+END_SRC

Open the checklist and my TODO list side-by-side:

#+BEGIN_SRC emacs-lisp
  (defun hrs/dashboard ()
    (interactive)
    (delete-other-windows)
    (hrs/today)
    (split-window-right)
    (hrs/open-index-file))

  (global-set-key (kbd "C-c d") 'hrs/dashboard)
#+END_SRC

* Email with =mu4e=

Use the =evil= bindings for navigation. They're very similar to the =mutt=
bindings, which matches my muscle memory nicely. =)

#+BEGIN_SRC emacs-lisp
  (use-package evil-mu4e)
  (require 'evil-mu4e)
#+END_SRC

** Where's my mail? Who am I?

I keep my mail in =~/.mail=. The default maildir would be =~/Maildir=, but I'd
rather hide it; I don't poke around in there manually very often.

This setting matches the paths in my =mbsync= configuration.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-maildir "~/.mail")
#+END_SRC

I only have one context at the moment. If I had another email account, though,
I'd define it in here with an additional =make-mu4e-context= block.

My full name is defined earlier in this configuration file.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-contexts
            :name "personal"
            :match-func (lambda (msg)
                          (when msg
                            (string-prefix-p "/personal" (mu4e-message-field msg :maildir))))
            :vars '((user-mail-address . "hello@harryrschwartz.com")
                    (mu4e-trash-folder . "/personal/archive")
                    (mu4e-refile-folder . "/personal/archive")
                    (mu4e-sent-folder . "/personal/sent")
                    (mu4e-drafts-folder . "/personal/drafts")))))
#+END_SRC

** Fetching new mail

I fetch my email with =mbsync=. I've also bound "o" to fetch new mail.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-get-mail-command "killall --quiet mbsync; mbsync inboxes")

  (define-key mu4e-headers-mode-map (kbd "o") 'mu4e-update-mail-and-index)
#+END_SRC

Rename files when moving them between directories. =mbsync= supposedly prefers
this; I'm cargo-culting.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-change-filenames-when-moving t)
#+END_SRC

Poll the server for new mail every 5 minutes.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-update-interval 300)
#+END_SRC

** Viewing mail

I check my email pretty often! Probably more than I should. This binds =C-c m=
to close any other windows and open my personal inbox.

In practice, I keep an =*mu4e-headers*= buffer in its own frame, full-screen, on
a dedicated =i3= workspace.

#+BEGIN_SRC emacs-lisp
  (defun hrs/visit-inbox ()
    (interactive)
    (delete-other-windows)
    (mu4e~headers-jump-to-maildir "/personal/inbox"))

  (global-set-key (kbd "C-c m") 'hrs/visit-inbox)
#+END_SRC

Open my inbox and sent messages folders with =J-i= and =J-s=, respectively.
These are the only two folders I visit regularly enough to warrant shortcuts.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-maildir-shortcuts '(("/personal/inbox" . ?i)
                                 ("/personal/sent" . ?s)))
#+END_SRC

=mu4e= starts approximately instantaneously, so I don't know why I'd want to
reconsider quitting it.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-confirm-quit nil)
#+END_SRC

** Composing a new message

When I'm composing a new email, default to using the first context.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-compose-context-policy 'pick-first)
#+END_SRC

Compose new messages (as with =C-x m=) using =mu4e-user-agent=.

#+BEGIN_SRC emacs-lisp
  (setq mail-user-agent 'mu4e-user-agent)
#+END_SRC

Enable Org-style tables and list manipulation.

#+BEGIN_SRC emacs-lisp
  (add-hook 'message-mode-hook 'turn-on-orgtbl)
  (add-hook 'message-mode-hook 'turn-on-orgstruct++)
#+END_SRC

Once I've sent an email, kill the associated buffer instead of just burying it.

#+BEGIN_SRC emacs-lisp
  (setq message-kill-buffer-on-exit t)
#+END_SRC

** Reading an email

Display the sender's email address along with their name.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-view-show-addresses t)
#+END_SRC

Save attachments in my =~/downloads= directory, not my home directory.

#+BEGIN_SRC emacs-lisp
  (setq mu4e-attachment-dir "~/downloads")
#+END_SRC

Hit =C-c C-o= to open a URL in the browser.

#+BEGIN_SRC emacs-lisp
  (define-key mu4e-view-mode-map (kbd "C-c C-o") 'mu4e~view-browse-url-from-binding)
#+END_SRC

While HTML emails are undeniably sinful, we often have to read them. That's
sometimes best done in a browser. This effectively binds =a h= to open the
current email in my default Web browser.

#+BEGIN_SRC emacs-lisp
  (add-to-list 'mu4e-view-actions '("html in browser" . mu4e-action-view-in-browser) t)
#+END_SRC

** Encryption

If a message is encrypted, my reply should always be encrypted, too.

#+BEGIN_SRC emacs-lisp
  (defun hrs/encrypt-responses ()
    (let ((msg mu4e-compose-parent-message))
      (when msg
        (when (member 'encrypted (mu4e-message-field msg :flags))
          (mml-secure-message-encrypt-pgpmime)))))

  (add-hook 'mu4e-compose-mode-hook 'hrs/encrypt-responses)
#+END_SRC

** Sending mail over SMTP

I send my email through =msmtp=. It's very fast, and I've already got it
configured from using =mutt=. These settings describe how to send a message:

- Use a sendmail program instead of sending directly from Emacs,
- Tell =msmtp= to infer the correct account from the =From:= address,
- Don't add a "=-f username=" flag to the =msmtp= command, and
- Use =/usr/bin/msmtp=!

#+BEGIN_SRC emacs-lisp
  (setq message-send-mail-function 'message-send-mail-with-sendmail)
  (setq message-sendmail-extra-arguments '("--read-envelope-from"))
  (setq message-sendmail-f-is-evil 't)
  (setq sendmail-program "msmtp")
#+END_SRC

** Org integration

=org-mu4e= lets me store links to emails. I use this to reference emails in my
TODO list while keeping my inbox empty.

#+BEGIN_SRC emacs-lisp
  (require 'org-mu4e)
#+END_SRC

When storing a link to a message in the headers view, link to the message
instead of the search that resulted in that view.

#+BEGIN_SRC emacs-lisp
  (setq org-mu4e-link-query-in-headers-mode nil)
#+END_SRC

** Configure BBDB with mu4e

Use BBDB to handle my address book.

#+BEGIN_SRC emacs-lisp
  (use-package bbdb)
  (require 'bbdb-mu4e)
#+END_SRC

Don't try to do address completion with mu4e. Use BBDB instead:

#+BEGIN_SRC emacs-lisp
  (setq mu4e-compose-complete-addresses nil)
#+END_SRC

* RSS with =elfeed=

Install elfeed:

#+BEGIN_SRC emacs-lisp
  (use-package elfeed)
#+END_SRC

Load up my feeds:

#+BEGIN_SRC emacs-lisp
  (use-package elfeed-org
    :config
    (progn
      (elfeed-org)
      (setq rmh-elfeed-org-files (list "~/feeds.org"))))
#+END_SRC

* Writing prose

** Enable spell-checking in the usual places

I want to make sure that I've enabled spell-checking if I'm editing text,
composing an email, or authoring a Git commit.

#+BEGIN_SRC emacs-lisp
  (use-package flyspell
    :config
    (add-hook 'text-mode-hook 'turn-on-auto-fill)
    (add-hook 'gfm-mode-hook 'flyspell-mode)
    (add-hook 'org-mode-hook 'flyspell-mode)

    (add-hook 'git-commit-mode-hook 'flyspell-mode)
    (add-hook 'mu4e-compose-mode-hook 'flyspell-mode))
#+END_SRC

** Look up definitions in Webster 1913

I look up definitions by hitting =C-x w=, which shells out to =sdcv=. I've
loaded that with the (beautifully lyrical) 1913 edition of Webster's dictionary,
so these definitions are a lot of fun.

#+BEGIN_SRC emacs-lisp
  (defun hrs/dictionary-prompt ()
    (read-string
     (format "Word (%s): " (or (hrs/region-or-word) ""))
     nil
     nil
     (hrs/region-or-word)))

  (defun hrs/dictionary-define-word ()
    (interactive)
    (let* ((word (hrs/dictionary-prompt))
           (buffer-name (concat "Definition: " word)))
      (with-output-to-temp-buffer buffer-name
        (shell-command (format "sdcv -n %s" word) buffer-name))))

  (define-key global-map (kbd "C-x w") 'hrs/dictionary-define-word)
#+END_SRC

** Look up words in a thesaurus

Synosaurus is hooked up to wordnet to provide access to a thesaurus. Hitting
=C-x s= searches for synonyms.

#+BEGIN_SRC emacs-lisp
  (use-package synosaurus)
  (setq-default synosaurus-backend 'synosaurus-backend-wordnet)
  (add-hook 'after-init-hook #'synosaurus-mode)
  (define-key global-map "\C-xs" 'synosaurus-lookup)
#+END_SRC

** Editing with Markdown

Because I can't always use =org=.

- Associate =.md= files with GitHub-flavored Markdown.
- Use =pandoc= to render the results.
- Leave the code block font unchanged.

#+BEGIN_SRC emacs-lisp
  (use-package markdown-mode
    :commands gfm-mode

    :mode (("\\.md$" . gfm-mode))

    :config
    (setq markdown-command "pandoc --standalone --mathjax --from=markdown")
    (custom-set-faces
     '(markdown-code-face ((t nil)))))
#+END_SRC

** Wrap paragraphs automatically

=AutoFillMode= automatically wraps paragraphs, kinda like hitting =M-q=. I wrap
a lot of paragraphs, so this automatically wraps 'em when I'm writing text,
Markdown, or Org.

#+BEGIN_SRC emacs-lisp
  (add-hook 'text-mode-hook 'auto-fill-mode)
  (add-hook 'gfm-mode-hook 'auto-fill-mode)
  (add-hook 'org-mode-hook 'auto-fill-mode)
#+END_SRC

** Cycle between spacing alternatives

Successive calls to =cycle-spacing= rotate between changing the whitespace
around point to:

- A single space,
- No spaces, or
- The original spacing.

Binding this to =M-SPC= is strictly better than the original binding of
=just-one-space=.

#+BEGIN_SRC emacs-lisp
  (global-set-key (kbd "M-SPC") 'cycle-spacing)
#+END_SRC

** Linting prose

I use [[http://proselint.com/][proselint]] to check my prose for common errors. This creates a flycheck
checker that runs proselint in texty buffers and displays my errors.

#+BEGIN_SRC emacs-lisp
  (require 'flycheck)

  (flycheck-define-checker proselint
    "A linter for prose."
    :command ("proselint" source-inplace)
    :error-patterns
    ((warning line-start (file-name) ":" line ":" column ": "
              (id (one-or-more (not (any " "))))
              (message (one-or-more not-newline)
                       (zero-or-more "\n" (any " ") (one-or-more not-newline)))
              line-end))
    :modes (text-mode markdown-mode gfm-mode org-mode))

  (add-to-list 'flycheck-checkers 'proselint)
#+END_SRC

Use flycheck in the appropriate buffers:

#+BEGIN_SRC emacs-lisp
  (add-hook 'markdown-mode-hook #'flycheck-mode)
  (add-hook 'gfm-mode-hook #'flycheck-mode)
  (add-hook 'text-mode-hook #'flycheck-mode)
  (add-hook 'org-mode-hook #'flycheck-mode)
#+END_SRC

** Enable region case modification

#+BEGIN_SRC emacs-lisp
  (put 'downcase-region 'disabled nil)
  (put 'upcase-region 'disabled nil)
#+END_SRC

** Quickly explore my "notes" directory with =deft=

#+BEGIN_SRC emacs-lisp
  (use-package deft
    :bind ("C-c n" . deft)
    :commands (deft)
    :config

    (setq deft-directory "~/documents/notes"
          deft-recursive t
          deft-use-filename-as-title t)

    (evil-set-initial-state 'deft-mode 'emacs))
#+END_SRC

* =dired=

Hide dotfiles by default, but toggle their visibility with =.=.

#+BEGIN_SRC emacs-lisp
  (use-package dired-hide-dotfiles
    :config
    (dired-hide-dotfiles-mode)
    (define-key dired-mode-map "." 'dired-hide-dotfiles-mode))
#+END_SRC

Open media with the appropriate programs.

#+BEGIN_SRC emacs-lisp
  (use-package dired-open
    :config
    (setq dired-open-extensions
          '(("pdf" . "zathura")
            ("mkv" . "vlc")
            ("mp3" . "vlc")
            ("mp4" . "vlc")
            ("avi" . "vlc"))))
#+END_SRC

These are the switches that get passed to =ls= when =dired= gets a list of
files. We're using:

- =l=: Use the long listing format.
- =h=: Use human-readable sizes.
- =v=: Sort numbers naturally.
- =A=: Almost all. Doesn't include "=.=" or "=..=".

#+BEGIN_SRC emacs-lisp
  (setq-default dired-listing-switches "-lhvA")
#+END_SRC

Use "j" and "k" to move around in =dired=.

#+BEGIN_SRC emacs-lisp
  (evil-define-key 'normal dired-mode-map (kbd "j") 'dired-next-line)
  (evil-define-key 'normal dired-mode-map (kbd "k") 'dired-previous-line)
#+END_SRC

Kill buffers of files/directories that are deleted in =dired=.

#+BEGIN_SRC emacs-lisp
  (setq dired-clean-up-buffers-too t)
#+END_SRC

Always copy directories recursively instead of asking every time.

#+BEGIN_SRC emacs-lisp
  (setq dired-recursive-copies 'always)
#+END_SRC

Ask before recursively /deleting/ a directory, though.

#+BEGIN_SRC emacs-lisp
  (setq dired-recursive-deletes 'top)
#+END_SRC

Open a file with an external program (that is, through =xdg-open=) by hitting
=C-c C-o=.

#+BEGIN_SRC emacs-lisp
  (defun dired-xdg-open ()
    "In dired, open the file named on this line."
    (interactive)
    (let* ((file (dired-get-filename nil t)))
      (call-process "xdg-open" nil 0 nil file)))

  (define-key dired-mode-map (kbd "C-c C-o") 'dired-xdg-open)
#+END_SRC

* Editing settings

** Quickly visit Emacs configuration

I futz around with my dotfiles a lot. This binds =C-c e= to quickly open my
Emacs configuration file.

#+BEGIN_SRC emacs-lisp
  (defun hrs/visit-emacs-config ()
    (interactive)
    (find-file "~/.emacs.d/configuration.org"))

  (global-set-key (kbd "C-c e") 'hrs/visit-emacs-config)
#+END_SRC

** Always kill current buffer

Assume that I always want to kill the current buffer when hitting =C-x k=.

#+BEGIN_SRC emacs-lisp
  (global-set-key (kbd "C-x k") 'hrs/kill-current-buffer)
#+END_SRC

** Set up =helpful=

The =helpful= package provides, among other things, more context in Help
buffers.

#+BEGIN_SRC emacs-lisp
  (use-package helpful)

  (global-set-key (kbd "C-h f") #'helpful-callable)
  (global-set-key (kbd "C-h v") #'helpful-variable)
  (global-set-key (kbd "C-h k") #'helpful-key)
  (evil-define-key 'normal helpful-mode-map (kbd "q") 'quit-window)
#+END_SRC

** Look for executables in =/usr/local/bin=

#+BEGIN_SRC emacs-lisp
  (hrs/append-to-path "/usr/local/bin")
#+END_SRC

** Save my location within a file

Using =save-place-mode= saves the location of point for every file I visit. If I
close the file or close the editor, then later re-open it, point will be at the
last place I visited.

#+BEGIN_SRC emacs-lisp
  (save-place-mode t)
#+END_SRC

** Always indent with spaces

Never use tabs. Tabs are the devil’s whitespace.

#+BEGIN_SRC emacs-lisp
  (setq-default indent-tabs-mode nil)
#+END_SRC

** Install and configure =which-key=

=which-key= displays the possible completions for a long keybinding. That's
really helpful for some modes (like =projectile=, for example).

#+BEGIN_SRC emacs-lisp
  (use-package which-key
    :config (which-key-mode))
#+END_SRC

** Configure =yasnippet=

#+BEGIN_SRC emacs-lisp
  (use-package yasnippet)
#+END_SRC

I keep my snippets in =~/.emacs/snippets/text-mode=, and I always want =yasnippet=
enabled.

#+BEGIN_SRC emacs-lisp
  (setq yas-snippet-dirs '("~/.emacs.d/snippets/text-mode"))
  (yas-global-mode 1)
#+END_SRC

I /don’t/ want =yas= to automatically indent the snippets it inserts. Sometimes
this looks pretty bad (when indenting org-mode, for example, or trying to guess
at the correct indentation for Python).

#+BEGIN_SRC emacs-lisp
  (setq yas/indent-line nil)
#+END_SRC

** Configure =ivy= and =counsel=

I use =ivy= and =counsel= as my completion framework.

This configuration:

- Uses =counsel-M-x= for command completion,
- Replaces =isearch= with =swiper=,
- Uses =smex= to maintain history,
- Enables fuzzy matching everywhere except swiper (where it's thoroughly
  unhelpful), and
- Includes recent files in the switch buffer.

#+BEGIN_SRC emacs-lisp
  (use-package counsel
    :bind
    ("M-x" . 'counsel-M-x)
    ("C-s" . 'swiper)

    :config
    (use-package flx)
    (use-package smex)

    (ivy-mode 1)
    (setq ivy-use-virtual-buffers t)
    (setq ivy-count-format "(%d/%d) ")
    (setq ivy-initial-inputs-alist nil)
    (setq ivy-re-builders-alist
          '((swiper . ivy--regex-plus)
            (t . ivy--regex-fuzzy))))
#+END_SRC

** Switch and rebalance windows when splitting

When splitting a window, I invariably want to switch to the new window. This
makes that automatic.

#+BEGIN_SRC emacs-lisp
  (defun hrs/split-window-below-and-switch ()
    "Split the window horizontally, then switch to the new pane."
    (interactive)
    (split-window-below)
    (balance-windows)
    (other-window 1))

  (defun hrs/split-window-right-and-switch ()
    "Split the window vertically, then switch to the new pane."
    (interactive)
    (split-window-right)
    (balance-windows)
    (other-window 1))

  (global-set-key (kbd "C-x 2") 'hrs/split-window-below-and-switch)
  (global-set-key (kbd "C-x 3") 'hrs/split-window-right-and-switch)
#+END_SRC

** Mass editing of =grep= results

I like the idea of mass editing =grep= results the same way I can edit filenames
in =dired=. These keybindings allow me to use =C-x C-q= to start editing =grep=
results and =C-c C-c= to stop, just like in =dired=.

#+BEGIN_SRC emacs-lisp
  (use-package wgrep)

  (eval-after-load 'grep
    '(define-key grep-mode-map
      (kbd "C-x C-q") 'wgrep-change-to-wgrep-mode))

  (eval-after-load 'wgrep
    '(define-key grep-mode-map
      (kbd "C-c C-c") 'wgrep-finish-edit))

  (setq wgrep-auto-save-buffer t)
#+END_SRC

** Use projectile everywhere

#+BEGIN_SRC emacs-lisp
  (projectile-global-mode)
#+END_SRC

** Add a bunch of engines for =engine-mode=

Enable [[https://github.com/hrs/engine-mode][engine-mode]] and define a few useful engines.

#+BEGIN_SRC emacs-lisp
  (use-package engine-mode)
  (require 'engine-mode)

  (defengine duckduckgo
    "https://duckduckgo.com/?q=%s"
    :keybinding "d")

  (defengine github
    "https://github.com/search?ref=simplesearch&q=%s"
    :keybinding "g")

  (defengine google
    "http://www.google.com/search?ie=utf-8&oe=utf-8&q=%s")

  (defengine rfcs
    "http://pretty-rfc.herokuapp.com/search?q=%s")

  (defengine stack-overflow
    "https://stackoverflow.com/search?q=%s"
    :keybinding "s")

  (defengine wikipedia
    "http://www.wikipedia.org/search-redirect.php?language=en&go=Go&search=%s"
    :keybinding "w")

  (defengine wiktionary
    "https://www.wikipedia.org/search-redirect.php?family=wiktionary&language=en&go=Go&search=%s")

  (defengine youtube
    "https://www.youtube.com/results?search_query=%s")

  (engine-mode t)
#+END_SRC

* Set custom keybindings

Just a few handy functions.

#+BEGIN_SRC emacs-lisp
  (global-set-key (kbd "C-w") 'backward-kill-word)
  (global-set-key (kbd "M-o") 'other-window)
#+END_SRC

Remap when working in terminal Emacs.

#+BEGIN_SRC emacs-lisp
  (define-key input-decode-map "\e[1;2A" [S-up])
#+END_SRC
* Extra

#+BEGIN_SRC emacs-lisp
  (load-file "~/.emacs-private.el")
#+END_SRC
`

export default () =>  parse(testText).map(line => { 
    return line.children.map(x => { 
        return x.content.map(x => <div>{x.text}</div>)
    })
})
