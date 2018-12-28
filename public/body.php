<?php if (filter_input(INPUT_SERVER, 'REQUEST_METHOD') != 'POST') {
  $res = [
    'status' => 403,
    'statusText' => 'Forbidden',
    'Content-Type' => 'octet-stream',
  ];
  header("HTTP/1.1 ${res['status']} ${res['statusText']}");
  header("Content-Type: ${res['Content-Type']}");
  echo json_encode($res);
  return;
} ?>
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
</body>