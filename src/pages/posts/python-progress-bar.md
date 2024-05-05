---
layout: ../../layouts/MarkdownPostLayout.astro
title: "为一个不确定进度的函数加上一个进度条"
pubDate: "2024-05-05"
tags: ["python"]
---

为一个正在运行的函数加上一个进度条可以帮助我们确定程序运行的进度，以及估计程序运行的状态。[tqdm](https://tqdm.github.io/) 是 Python 下一个非常有用的模块，可以为一个可迭代的对象添加一个美观的进度条，比如在一个 for 循环中，或者一个 range() 函数下。这里之所以说是为一个可迭代的对象添加进度条，是因为只有对于一个可迭代对象才能计算一个百分比，从而确定迭代的进度。然而，对于一个不可迭代的对象，比如一个执行时间很长、而又不确定执行时间的函数，则就不容易估计它的进度。一般对于这种情况，也不太有人会为这样一个函数添加一个进度条。因此，这只是一个很小的需求，对于我来说，有时候会在终端执行一个需要较长时间运行的函数，这个时候，如果能为这个函数添加一个进度条，而不至于在盯着终端的时候只有一个闪烁的光标，可能会在心理上给人一种暗示，即这个程序正在顺利执行的错觉吧。

对于这样一个不确定执行进度的函数，由于不能确定它的进度，因此它的进度条应该是一个无限循环的进度条。那么，要实现这样一个无限循环的进度条，则需要两个线程的支持，一个线程显示这个无限循环的进度条，另一个线程执行那个长时间运行的函数，当这个函数结束的时候，无限循环的进度条也就终止。


## 用类的方式实现

因为是多线程的实现，同时考虑到后期可能对进度条的样式进行自定义的设置，因此可以通过类的方式进行实现。用户的函数作为参数传递给这个类，然后在这个类里面创建两个线程，一个线程是用户函数的入口，另一个线程是进度条函数的入口。在这个类里面可以实现一种进度条的样式，而自定义的进度条样式可以通过继承这个类来实现。考虑到用户的函数可能有返回值的情况，因此还需要用到队列，把用户函数的返回值保存在这个队列中。

具体的代码如下。首先定义一个类，它的初始化为用户的函数名及其参数。另外，再定义一个线程和队列的变量，由于它们是在初始化中定义的，因此它们的初始值先设为 `None`。

```python
from multiprocessing import Process, Queue
import time

class ProgressBar():
    def __init__(self, func, *args, **kws):
        self.func = func
        self.args = args
        self.kws = kws

        self.p = None
        self.queue = None
```

当创建一个线程的时候，需要传入一个入口函数，即用户的函数。因此在这个类里面再定义一个入口函数，同时把函数执行的结果保存在一个队列里。

```python
def job_queue(self):
    return_values = self.func(*self.args, **self.kws)
    self.queue.put(return_values)
```

接下来定义一个无限循环的进度条函数，它的终止条件就是传入用户函数的线程完成时的信号。一个最简单的无限循环的进度条就是一个旋转的光标。其它的进度条样式我们在后面通过继承这个类来实现。

```python
def is_alive(self):
    return self.p.is_alive()

def progress_bar(self):
    from itertools import cycle
    for c in cycle("-\\|/"):
        if not self.is_alive():
            print("")
            break
        print(f"\b{c}", flush=True, end="")
        time.sleep(0.2)
```

最后，我们定义一个 `run()` 函数来创建线程，并执行程序。

```python
def run(self):
    self.queue = Queue()
    self.p = Process(daemon=True, target=self.job_queue)
    self.p.start()

    print(f"Function {self.func.__name__} is running")
    self.progress_bar()

    return self.queue.get()
```

我们再写一个测试函数来测试一下上述代码。

```python
def my_job(a, b=42):
    time.sleep(15)
    return a,b
```

需要注意的是，由于我们使用了多线程，为了能够使当前运行的程序创建新的线程，需要在 `__name__ == "__main__"` 下运行。

```python
if __name__ == "__main__":
    progress = ProgressBar(my_job, 24, b=42)
    ret = progress.run()
    print("Finished.")
    print(f"Return value: {ret}")
```

最终的效果如下。

![progress-bar-0](/progress-bar-0.gif)


我们可以通过类的继承，来实现自定义的进度条样式。

```python
class myProgressBar(ProgressBar):
    def __init__(self, func, *args, **kws):
        ProgressBar.__init__(self, func, *args, **kws)

    def progress_bar(self):
        width = 20
        backspace_width = (width+4)*'\b'
        i = 0
        while(1):
            if not self.is_alive():
                print("")
                break
            arrow = "->" if i>=0 else "<-"
            print(f"[{abs(i)*' '}{arrow}{(width-abs(i))*' '}]" + backspace_width, flush=True, end="")
            i = i+1 if i < width else -width
            time.sleep(0.1)
```

该进度条所实现的效果如下。

![progress-bar-1](/progress-bar-1.gif)


## 用类装饰器的方式实现

我们可以看到，使用上面的方式实现的进度条，需要创建一个类的实例，然后把用户的函数及其参数传递进去，还要通过调用 `run()` 函数来执行程序，这样使用起来有些麻烦。改进的方法就是使用类装饰器，优点就是可以不用改变用户程序的结构，只需要添加一行代码就可以使用了。

在上述代码的基础上，我们只需要实现类的 `__call__()` 函数就可以把它变成一个装饰器，即把用户函数名传递给 `__call__()` ，把用户函数的参数传递给 `__call__()` 下面的闭包函数。

这里需要注意的是，带参数的类装饰器和不带类参数的装饰器有很大的区别。类装饰器本是上就是把被修饰的用户函数作为类的实例。对于不带参数的类装饰器（@后面只有类名，没有括号），被修饰的函数名作为 `__init__()` 的初始化参数，被修饰的函数参数则传递给 `__call__()` 函数。而对于带参数的类装饰器（@后面有括号，括号内的参数可以为空），该参数作为 `__init__()` 的初始化参数，而被修饰的函数名则传递给 `__call__()` 函数，被修饰的函数参数传递给 `__call__()` 函数内部自定义的闭包函数。

```python
class ProgressBar():
    def __init__(self, style=1):
        self.style = style
        self.func = None
        self.args = None
        self.kws = None
        self.p = None
        self.queue = None
    
    def __call__(self, func):
        self.func = func

        def run(*args, **kws):
            self.args = args
            self.kws = kws
            self.queue = Queue()
            self.p = Process(daemon=True, target=self.job_queue)
            self.p.start()

            print(f"Function {self.func.__name__} is running")
            if self.style == 0:
                self.progress_bar_style_0()
            elif self.style == 1:
                self.progress_bar_style_1()
            elif self.style == 2:
                self.progress_bar_style_2()
            else:
                self.progress_bar_style_0()

            return self.queue.get()
        return run
```

可以看到，上述函数实际上只是把 `run()` 当作了 `__call__()` 下面的一个闭包函数。在这个类装饰器下面实现了三个进度条的样式，通过 `style` 这个类装饰器参数来进行选择。

这个类装饰器使用起来也很简单。

__需要注意的是__，上述代码可以在 CentOS 7, Python 3.6.8 下成功运行，但是在 Win10 22H2, Python 3.11.5 下运行会报错。错误信息为“OSError: [WinError 87] The parameter is incorrect”，经查询可能是 Python 的一个 bug。

```python
@ProgressBar(style=2)
def another_job(a, b=42):
    time.sleep(15)
    return a,b

if __name__ == "__main__":
    ret = other_job(42, b="Hello")
    print("Finished.")
    print(f"Return value: {ret}")
```

所实现的效果如下。

![progress-bar-2](/progress-bar-2.gif)


## 方式一的完成代码

```python
from multiprocessing import Process, Queue
import time

class ProgressBar():
    def __init__(self, func, *args, **kws):
        self.func = func
        self.args = args
        self.kws = kws

        self.p = None
        self.queue = None

   def job_queue(self):
        return_values = self.func(*self.args, **self.kws)
        self.queue.put(return_values)

    def is_alive(self):
        return self.p.is_alive()

    def progress_bar(self):
        from itertools import cycle
        for c in cycle("-\\|/"):
            if not self.is_alive():
                print("")
                break
            print(f"\b{c}", flush=True, end="")
            time.sleep(0.2)
    
    def run(self):
        self.queue = Queue()
        self.p = Process(daemon=True, target=self.job_queue)
        self.p.start()

        print(f"Function {self.func.__name__} is running")
        self.progress_bar()

        return self.queue.get()

class myProgressBar(ProgressBar):
    def __init__(self, func, *args, **kws):
        ProgressBar.__init__(self, func, *args, **kws)

    def progress_bar(self):
        width = 20
        backspace_width = (width+4)*'\b'
        i = 0
        while(1):
            if not self.is_alive():
                print("")
                break
            arrow = "->" if i>=0 else "<-"
            print(f"[{abs(i)*' '}{arrow}{(width-abs(i))*' '}]" + backspace_width, flush=True, end="")
            i = i+1 if i < width else -width
            time.sleep(0.1)

def my_job(a, b=42):
    time.sleep(15)
    return a,b

if __name__ == "__main__":
    progress = ProgressBar(my_job, 24, b=42)
    ret = progress.run()
    print("Finished.")
    print(f"Return value: {ret}")

    progress = myProgressBar(my_job, "Hello", "World")
    ret = progress.run()
    print("Finished.")
    print(f"Return value: {ret}")
```

## 方式二的完整代码

```python
from multiprocessing import Process, Queue
import time

class ProgressBar():
    def __init__(self, style=1):
        self.style = style
        self.func = None
        self.args = None
        self.kws = None
        self.p = None
        self.queue = None
    
    def __call__(self, func):
        self.func = func

        def run(*args, **kws):
            self.args = args
            self.kws = kws
            self.queue = Queue()
            self.p = Process(daemon=True, target=self.job_queue)
            self.p.start()

            print(f"Function {self.func.__name__} is running")
            if self.style == 0:
                self.progress_bar_style_0()
            elif self.style == 1:
                self.progress_bar_style_1()
            elif self.style == 2:
                self.progress_bar_style_2()
            else:
                self.progress_bar_style_0()

            return self.queue.get()
        return run
    
    def job_queue(self):
        return_value = self.func(*self.args, **self.kws)

        self.queue.put(return_value)
    
    def is_alive(self):
        return self.p.is_alive()
    
    def progress_bar_style_0(self):
        from itertools import cycle
        for c in cycle("-\\|/"):
            if not self.is_alive():
                print("")
                break
            print(f"\b{c}", flush=True, end="")
            time.sleep(0.2)
    
    def progress_bar_style_1(self):
        width = 20
        backspace_width = (width+4)*'\b'
        i = 0
        while(1):
            if not self.is_alive():
                print("")
                break
            arrow = "->" if i>=0 else "<-"
            print(f"[{abs(i)*' '}{arrow}{(width-abs(i))*' '}]" + backspace_width, flush=True, end="")
            i = i+1 if i < width else -width
            time.sleep(0.1)
    
    def progress_bar_style_2(self):
        start_time = time.time()
        while(1):
            if not self.is_alive():
                print("")
                break
            time.sleep(1)
            seconds = time.time() - start_time
            
            minutes, seconds = divmod(seconds, 60)
            hours, minutes = divmod(minutes, 60)

            return_char = '\r'
            print(f"Elapsed: {hours:02.0f}:{minutes:02.0f}:{seconds:02.0f}{return_char}", flush=True, end="")

@ProgressBar(style=2)
def another_job(a, b=42):
    time.sleep(10)
    return a,b

if __name__ == "__main__":
    ret = another_job(42, b="Hello")
    print("Finished.")
    print(f"Return value: {ret}")
```
