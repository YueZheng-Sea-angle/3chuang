# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# 智能手杖仪表盘

## 项目简介
智能手杖仪表盘是一个基于 React 和 TypeScript 的现代化 Web 应用，旨在为智能手杖设备提供直观的用户界面。用户可以通过仪表盘实时监控设备状态、进行语音控制、查看导航地图等。

## 技术栈
- **React**: 用于构建用户界面。
- **TypeScript**: 提供静态类型检查，提升代码质量。
- **Vite**: 作为开发服务器和构建工具，提供快速的开发体验。
- **PNPM**: 高效的包管理工具。
- **ESLint**: 用于代码质量检查。

## 项目结构
```
smart-cane-dashboard/
├── docs/                # 文档文件
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── assets/          # 图片、图标等资源
│   ├── components/      # 可复用的 UI 组件
│   ├── pages/           # 应用页面
│   ├── services/        # API 和服务逻辑
│   ├── store/           # 状态管理
│   ├── styles/          # 样式文件
│   └── types/           # TypeScript 类型定义
├── eslint.config.js     # ESLint 配置
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
└── package.json         # 项目元数据和依赖
```

## 快速开始

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-repo/smart-cane-dashboard.git
   ```

2. 进入项目目录：
   ```bash
   cd smart-cane-dashboard
   ```

3. 安装依赖：
   ```bash
   pnpm install
   ```

4. 启动开发服务器：
   ```bash
   pnpm dev
   ```
   默认情况下，应用会运行在 `http://localhost:5173`。

## 构建

运行以下命令以进行生产环境构建：
```bash
pnpm build
```
构建输出位于 `dist/` 目录。

## 贡献

欢迎贡献代码！请遵循以下步骤：
1. Fork 仓库。
2. 创建一个分支以开发新功能或修复 Bug。
3. 提交更改并推送分支。
4. 创建 Pull Request。

## 联系方式

如有问题或需要支持，请联系项目维护者：`support@smartcane.com`。
