# Hidden AE CEP task runner

Run extendscript task in After Effects at regular interval. The extension is invisible and start automatically at AE launch.

## How to start?

Replace globally "com.demo.hiddentaskrunner" by your extension ID and "Hidden Task Runner" by your extension name.

## How to run task?

In index.js, replace `apiVarName` value with your API variable. Use `createTask(apiMethodName, args, interval, cb)` function to launch a task. 

For example, if you want to execute the method `myMethod` of an object called `myApi` every 5 seconds and pass to this method a `message` argument:
````javascript
var apiVarName = "myApi";
initScript("/src/extendscript/hostscript.jsx", function() {
    createTask("myMethod", { message: "Hello" }, 5 * 1000, function(result) {
        console.log(result);
    });
});
````
Please note that in this example, `myApi` is initalized with `initScript()` which run `hostscript.jsx` before creating the task. This is optional if you want to call a method of another running script.

## How to build your ZXP?

Install NPM dependencies with `npm install`, and edit file `build.config.json`. Command `npm run build` will package and sign your extension with a certificate generated with `certificate` parameters. Use `package.include` to define which files to package. You can use glob patterns.

If you keep `-install` parameter in your build command, the extension will be installed automatically.

## How to debug?

- In Chrome, go to chrome://inspect
- Check "Discover network targets" and click on "Configure"
- Add localhost:9080, or another port if you have edited `port` in `.debug` and click on "Done"
- Click on "Inspect" below "Hidden Task Runner"
