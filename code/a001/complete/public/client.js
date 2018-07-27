(function() {
  const HOST = '';

  main();



  // ================
  // Helper functions
  // ================
  function main() {
    let page = document.body.id,
        methods = {
          index: initIndex,
          dashboard: initDashboard
        };

    methods[page]();
  }

  // Code for index.html
  function initIndex() {
    let signInButton = document.getElementById('button-signin'),
        signUpButton = document.getElementById('button-signup');

    signInButton.addEventListener('click', handleIndexButtonClick);
    signUpButton.addEventListener('click', handleIndexButtonClick);
  }

  // Code for dashboard.html
  function initDashboard() {
    let usernameInput = document.getElementById('input-username'),
        newPasswordInput = document.getElementById('input-newpassword'),
        confirmNewPasswordInput = document.getElementById('input-confirmnewpassword'),
        emailInput = document.getElementById('input-email'),
        mobileInput = document.getElementById('input-mobile'),
        signOutButton = document.getElementById('button-signout');

    fetch('/api/user')
      .then((response) => response.json())
      .then((data) => {
        let { username, email, mobile } = data;

        usernameInput.value = username;
        emailInput.value = email;
        mobileInput.value = mobile;
      });

    signOutButton.addEventListener('click', handleSignOutButtonClick);
  }

  function handleIndexButtonClick(event) {
    event.preventDefault();

    let route = event.target.dataset.route,
        method = 'POST',
        headers = { 'Content-Type': 'application/json' },
        username = document.getElementById('input-username').value,
        password = document.getElementById('input-password').value,
        email = document.getElementById('input-email').value,
        mobile = document.getElementById('input-mobile').value,
        body = JSON.stringify({ username, password, email, mobile });

    // Authentication request
    fetch(`${HOST}/${route}`, { method, headers, body, redirect: 'follow' })
      .then((response) => {
        // console.log(
        //   'OK: ', response.ok,
        //   '\nStatus: ', response.status,
        //   '\nStatus text: ', response.statusText
        // );

        if (response.redirected) {
          window.location.assign(response.url);
        }
        else {
          return response.json();
        }
      })
      .then((data) => {
        // console.log(data);
      })
      .catch((error) => {
        // console.error(`Something went wrong during sign in! Error: ${error}`);
      });
  }

  function handleSignOutButtonClick(event) {
    event.preventDefault();

    fetch('/signout')
      .then((response) => {
        // console.log(response);
        window.location.assign(response.url);
      });
  }
})()
