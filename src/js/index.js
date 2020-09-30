var csInterface = new CSInterface();

var apiVarName = "myApi";

var initScript = function(path, cb) {
    csInterface.evalScript('$.evalFile("' + csInterface.getSystemPath(SystemPath.EXTENSION) + path + '")', cb);
}

var createCommand = function(apiMethodName, args) {
    if(typeof args === "undefined") args = {};
    return '(function() { if(typeof ' + apiVarName + ' !== "undefined") return ' + apiVarName + '.' + apiMethodName + '(' + JSON.stringify(args) + '); else return null; })()';
}

var createTask = function(apiMethodName, args, interval, cb) {
    var task = function() {
        csInterface.evalScript(createCommand(apiMethodName, args), cb);
    }
    setInterval(task, interval);
}

// Launch JSX script to initialize your methods (optional if you want to run method from an existing script)
initScript("/src/extendscript/hostscript.jsx", function() {
    // Here we execute myApi.myMethod({ message: "Hello" }) every 5 seconds if myApi is declared
    createTask("myMethod", { message: "Hello" }, 5 * 1000, (result) => {
        // Here you can JSON.parse the result if your method returns an object
        console.log(result);
    });
});