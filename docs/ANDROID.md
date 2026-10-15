# 安卓兼容检测状态

目标项目：[Paper-Yuan/Stronghold-Protocol](https://github.com/Paper-Yuan/Stronghold-Protocol)，安卓代码在 feature/android-client 分支。当前读取提交 6b31c3b2e98db2aab5c987b0512601531d8eca24；其 package.json 标注 0.1.3，技术文档标注内嵌 Node.js 18.20.4。

当前酒馆模组基于原版 0.2.6，服务端脚本使用 Node.js 22。版本与运行环境不同，不能用版本号强行绕过安装校验，也不能把浏览器窄屏通过当作安卓 APK 通过。

安卓访问远端测试服与安卓内嵌开服需要分开验证；本次仅交付服务器兼容测试包，尚未构建或实机验收安卓 APK。
