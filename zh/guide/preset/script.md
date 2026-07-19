# 脚本使用指南

![脚本](../../images/preset_script.png)

## 字段说明

* 优先级：决定脚本注入的顺序
* 类型：脚本的类型，决定脚本注入的方式
    * link：以链接的方式引用，内容需填写一个js的url。
    * module：以模块的方式注入页面，所创建的常量会被隔离。
    * importmap：以importmap的方式注入页面，所有的importmap将被合并为一个json，放到`script[type='importmap']`中。
    * application/javascript (default)：以js文本的方式直接注入页面
* 内容：根据脚本的类型填写相应的内容