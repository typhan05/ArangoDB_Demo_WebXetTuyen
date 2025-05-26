# Các Hệ Cơ Sở Dữ Liệu

Xây dựng một hệ thống đăng ký xét tuyển Đại học, sử dụng CSDL ArangoDB

## Tech Stack

**Client:** React, TailwindCSS

**Server:** Python

## Installation

\*\* Backend

- [Cài đặt Anaconda (môi trường để chạy Python)](https://www.anaconda.com/download/)
- [Cài đặt Python](https://www.python.org/downloads/)

\*\* Frontend

- [Cài đặt Nodejs](https://nodejs.org/en) - Node version v22.6.0 - v23.9.0
- [Cài đặt Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable) - Yarn version >=1.22.19

## Running Tests

Start Backend

```bash
  cd backend
  conda create -n ten_moi_truong python=3.12
  conda activate ten_moi_truong
  pip install -r requirements.txt
  uvicorn main:app --reload
```

=> Server Backend start http://localhost:8000/docs

Start Frontend

```bash
  cd frontend
  yarn install
  yarn dev
```

Lưu Ý: Sửa file _.env.example_ => _.env_ và bỏ comment **NEXT_PUBLIC_BASE_URL** để call backend api

=> Server Frontend start http://localhost:5173
