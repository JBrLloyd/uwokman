import { writable } from 'svelte/store';
import { Theme } from '../types/enums';

export const currentTheme = writable<Theme>(localStorage.theme ?? Theme.Dark);

const changeTheme = (theme: Theme) => {
  localStorage.theme = theme;
  // Whenever the user explicitly chooses to respect the OS preference
  // localStorage.removeItem('theme')

  // On page load or when changing themes, best to add inline in `head` to avoid FOUC
  if (theme === Theme.Dark || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

currentTheme.subscribe(changeTheme);
