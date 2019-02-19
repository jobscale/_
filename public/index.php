<!DOCTYPE html>
<!--
Copyright (c) 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="Description" content="just jsx.jp site.">
  <meta name="theme-color" content="black">
  <title>jsx.jp</title>
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="//<?= filter_input(INPUT_SERVER, 'HTTP_HOST') ?>/cdn/css/common.css">
  <script defer src="https://www.gstatic.com/firebasejs/5.8.3/firebase-app.js"></script>
  <script defer src="https://www.gstatic.com/firebasejs/5.8.3/firebase-messaging.js"></script>
  <script defer src="/cdn/js/common.js"></script>
  <script defer src="/cdn/js/app.js"></script>
  <script defer src="/cdn/js/channelio.js"></script>
</head>
<body>
  <div class="flex-center position-ref full-height">
    <div class="top-right links">
      <a href="http://gate.jsx.jp/login">Login</a>
      <a href="http://gate.jsx.jp/register">Register</a>
    </div>
    <div class="content">
      <div class="title">
        <div>welcome <?= exec('hostname'); ?></div>
      </div>
      <div class="title">
        <div>hello <?= filter_input(INPUT_SERVER, 'REMOTE_ADDR') ?></div>
      </div>
      <div class="title m-b-md">
        <div id='date'><?= (new DateTime)->format('Y-m-d H:i:s') ?></div>
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
  <main>
    <div id="token_div">
      <p id="token"></p>
    </div>
    <div id="permission_div">
      <p id="token"></p>
    </div>
    <div id="messages"></div>
  </main>
</body>
</html>
