#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

inquirer.prompt([
  {
    type: 'list',
    name: 'operation',
    message: '请选择一种操作',
    choices: ['创建页面', '创建组件'],
    filter: function (val) {
      const map = {
        '创建页面': 'page',
        '创建组件': 'component'
      };
      return map[val];
    }
  },
  {
    type: 'input',
    name: 'dirName',
    // 根据上一个的答案来决定显示什么message
    message: answers => {
      return `请输入${answers.operation === 'page' ? '页面' : '组件'}的名称`;
    },
  }
]).then(answers => {

  const dirPath = path.join(process.cwd(), answers.dirName);

  // 判断文件夹是否存在
  if (fs.existsSync(dirPath)) {
    console.log('文件夹已存在');
    return;
  }

  if (answers.operation === 'page') {
    console.log('创建页面');
    // 扫描执行命令的项目根目录下是否有app.json文件
    console.log(process.cwd());

    // 向上查找app.json文件
    let currentDir = process.cwd();
    while (!fs.existsSync(path.join(currentDir, 'app.json'))) {
      currentDir = path.join(currentDir, '../');
      if (currentDir === '/') {
        console.log('请在小程序项目中执行');
        return;
      }
    }

    // 读取app.json文件
    const appJson = JSON.parse(fs.readFileSync(path.join(currentDir, 'app.json'), 'utf-8'));
    if (appJson?.subpackages?.length) {
      // 找出app.json中所有分包名称
      const subpackages = appJson.subpackages.map(item => item.root);
      // 找出当前执行命令的目录在哪个分包中
      const currentDirInSubPackageIndex = subpackages.findIndex(item => process.cwd().indexOf(item) > -1);
      if (currentDirInSubPackageIndex !== -1) {
        // 在分包中
        console.log('在分包中');
        const currentDirInSubPackage = subpackages.find(item => process.cwd().indexOf(item) > -1);
        const url = `${process.cwd().split(currentDirInSubPackage)[1]}/${answers.dirName}/index`;
        console.log(url);
        // 在app.json中的分包中添加页面
        appJson.subpackages[currentDirInSubPackageIndex].pages.push(url);
        // 写入app.json文件
        fs.writeFileSync(path.join(currentDir, 'app.json'), JSON.stringify(appJson, null, 2));
      } else {
        // 不在分包中
        console.log('不在分包中');
        createPageInMainPackage(appJson, currentDir, answers.dirName);
      }
    } else {
      // 没有分包
      console.log('没有分包');
      createPageInMainPackage(appJson, currentDir, answers.dirName);
    }

    console.log(currentDir);
  }
  if (answers.operation === 'component') {
    console.log('创建组件');
  }

  // 创建文件夹
  fs.mkdirSync(dirPath);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // 将文件夹中的指定文件复制到另一个文件夹中,遍历文件夹中的所有文件
  copyFile(path.join(__dirname, `./template/${answers.operation}`), dirPath);

})

// 在主包中创建页面
function createPageInMainPackage(appJson, currentDir, dirName) {
  const url = `${process.cwd().split(currentDir)[1]}/${dirName}/index`;
  appJson.pages.push(url);
  fs.writeFileSync(path.join(currentDir, 'app.json'), JSON.stringify(appJson, null, 2));
}

// 从一个文件夹复制文件到另一个文件夹
function copyFile(fromPath, toPath) {
    fs.readdirSync(fromPath).forEach(fileName => {
    fs.copyFileSync(
      path.join(fromPath, fileName),
      path.join(toPath, fileName)
    );
  });
}