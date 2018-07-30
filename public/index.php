<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>jaxjp</title>

        <!-- Styles -->
        <style>
            * { overflow: hidden; }
            html, body {
                color: #222;
                background-color: #666;
                height: 100vh;
                margin: 0;
            }

            .full-height {
                height: 100vh;
            }

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
            }

            .position-ref {
                position: relative;
            }

            .top-right {
                position: absolute;
                right: 4vw;
                top: 3vh;
            }

            .content {
                text-align: center;
            }

            .title {
                font-size: 6vw;
                letter-spacing: .3vw;
            }

            .links > a {
                color: #222;
                padding: 0 1vw;
                font-size: 2vw;
                letter-spacing: .3vw;
                text-decoration: none;
                text-transform: uppercase;
            }

            .m-b-md {
                margin-bottom: 12vh;
            }
        </style>
    </head>
    <body>
        <div class="flex-center position-ref full-height">
            <div class="top-right links">
                <a href="http://gate.jsx.jp/login">Login</a>
                <a href="http://gate.jsx.jp/register">Register</a>
            </div>

            <div class="content">
                <div class="title m-b-md">
<div><?= exec('hostname'); ?> - hello <?= filter_input(INPUT_SERVER, 'REMOTE_ADDR') ?></div>
<div id='date'><?= (new DateTime)->format('Y-m-d H:i:s') ?></div>
<script>
setInterval(() => {
  fetch('/date.php', { method: 'post' })
  .then(response => response.text())
  .catch(e => e.message)
  .then(text => {
    document.getElementById('date').innerHTML = text;
  });
}, 1000);
</script>
                </div>

                <div class="links">
                    <a href="https://laravel.com/docs">Documentation</a>
                    <a href="https://laracasts.com">Laracasts</a>
                    <a href="https://laravel-news.com">News</a>
                    <a href="https://forge.laravel.com">Forge</a>
                    <a href="https://github.com/laravel/laravel">GitHub</a>
                </div>
            </div>
        </div>
    </body>
</html>
