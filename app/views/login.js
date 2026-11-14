import { login, esc } from "../state.js";
export async function render(root, ctx) {
  root.innerHTML = `
    <h1 class="v-title">Welcome to Chommie.</h1>
    <p class="v-lede">Your teaching buddy. Log in with any email and any password. This is a demo: nothing is checked and your password is never saved.</p>
    <form class="panel-box form-narrow" id="login-form" novalidate>
      <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="you@school.co.za" /></div>
      <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required /></div>
      <p class="notice notice--bad" id="login-err" role="alert" hidden>Type an email and a password to carry on.</p>
      <button class="btn btn--accent btn--big" type="submit" id="login-go">Log in</button>
    </form>`;
  root.querySelector("#login-form").onsubmit = (e) => {
    e.preventDefault();
    const em = root.querySelector("#email").value.trim(), pw = root.querySelector("#password").value;
    if (!em || !pw) { root.querySelector("#login-err").hidden = false; return; }
    login(em); ctx.go("classes");
  };
}
