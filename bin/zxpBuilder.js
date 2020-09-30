#!/usr/bin/env node

const path = require("path");
const fs = require("fs-extra");
const exman = require("exman");
const copyfiles = require("copyfiles");
const zxpSignCmd = require("zxp-sign-cmd");
const prompt = require("prompt-sync")();
const { exec } = require("child_process");

const [, , ...args] = process.argv;

let cmd_args = {
  install: false,
};

const find_args = {
  install: "-install",
};

//get others args, and set default
for (var i = 0; i < args.length; i++) {
  for (var key in find_args) {
    if (args[i].indexOf(find_args[key]) === 0) {
      cmd_args[key] = args[i].replace(find_args[key], "") || true;
    }
  }
}

function copyExtensionFiles(include, exclude, outputPath) {
  //Output path need to be added in last entry (bad practice of copyfiles module)
  include.push(outputPath);
  return new Promise((resolve, reject) => {
    console.log("Copying temporary files in " + outputPath + "...");
    copyfiles(
      include,
      {
        exclude,
        all: true
      },
      err => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
}

function getCertificateOptions(options, extensionId) {
  const needed_infos = ["country", "province", "org"];
  needed_infos.forEach(info => {
    if (!options[info]) throw "Certificate data " + info + " is missing";
  });
  if (!options.password) {
    const password = prompt("Enter certificate password: ");
    if (password) options.password = password;
    else throw "Certificate password is needed.";
  }
  options.name = extensionId;
  return options;
}

function createZxpPackage(
  certificateOptions,
  certificateOutput,
  inputDir,
  zxpOutput
) {
  return new Promise((resolve, reject) => {
    zxpSignCmd.selfSignedCert({...certificateOptions, output: certificateOutput}).then(() => {
      const signOptions = {
        input: inputDir,
        output: zxpOutput,
        cert: certificateOutput,
        password: certificateOptions.password
      };
      if (certificateOptions.timestamp) signOptions.timestamp = certificateOptions.timestamp;
      
      console.log("Signing extension at " + zxpOutput);
      return zxpSignCmd.sign(signOptions);
    }).then(() => {
      console.log("Checking conformity of extension...");
      fs.remove(inputDir, err3 => {
        if(err3) console.error(err3)
      });
      return zxpSignCmd.verify({
        input: zxpOutput,
        info: true
      });
    }).then(result => resolve(result)).catch(e => reject(e));
  });
}

function zxpBuild(autoInstall = false) {
  return new Promise((resolve, reject) => {
    const startTime = new Date().getTime();
    const buildConfig = JSON.parse(fs.readFileSync("build.config.json", "utf-8"));
    const outputDir = path.resolve("dist");
    const tmpDir = path.normalize(outputDir + "/" + "temp");
    const outputZxp = path.normalize(outputDir + "/" + buildConfig.extension_id + ".zxp");
    const outputCertificate = path.normalize(outputDir + "/" + buildConfig.extension_id + ".p12");
  
    const certificateOptions = getCertificateOptions(buildConfig.certificate, buildConfig.extension_id);
  
    fs.removeSync(tmpDir);
    fs.removeSync(outputZxp);
    fs.removeSync(outputCertificate);
  
    copyExtensionFiles(buildConfig.package.include, buildConfig.package.exclude, tmpDir).then(() => {
      return createZxpPackage(
        certificateOptions,
        outputCertificate,
        tmpDir,
        outputZxp
      );
    }).then(result => {
      console.log("Conformity check: ", result);
      console.log(
        "Extension built successfully in " +
        Math.round((new Date().getTime() - startTime) / 1000) +
        " seconds, and saved at " +
        path.dirname(outputZxp)
      );
      if(autoInstall === true) {
        console.log("Installing extension...");
        exman.install(outputZxp).then(() => console.log(outputZxp + ' has been installed')).catch(e => console.error(e.toString('utf8')));
      }
      resolve(outputZxp);
    }).catch(e => reject(e));
  })
}

zxpBuild(cmd_args.install ? true : false).catch(e => { throw e; })
