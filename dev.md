# PosFlow

[TOC]

##To-do List

- 稳定版 !important -- 林翔 / 侯昕李
- link / unlink 按钮 / 交互+ -- 杨赟

##放大镜

###逻辑

入口暂定为两种方式, 两个放大/缩小的图标 加上快捷键 如 Ctrl + [] 或者使用鼠标滚轮

至于如何在放大情况下调整当前放大区域, 暂时考虑使用鼠标拖动的方式

实现功能 缩略图 / 放大

实现方法 通过d3.mouse监听鼠标事件, 动态调整背景的video-container的位置和大小 但是保证整个viewport一直被视频内容完全填充

###界面

略

###接口

function scoping()

###参数列表

无, 但可能需要新增全局变量, 缩放比例以及位置, 以保证视频完全填充整个窗口.