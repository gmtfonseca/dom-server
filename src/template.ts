import { CompileContentToHTMLInput } from './types'

export function compileContentToHTML(input: CompileContentToHTMLInput): string {
  const cartItemsTable = input.cartItems
    .map((cartItem) => {
      return `<tr>
              <td class="align-center">${cartItem.product.reference}</td>
              <td class="align-left">${cartItem.product.name}</td>
              <td class="align-right">${cartItem.quantity}</td>
            </tr>`
    })
    .join('')

  const template = `
  <html>
    <head>
      <style>
        body {
          font-family: sans-serif;
        }

        table {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
          border-collapse: collapse;
        }

        table thead {
          color: white;
          background-color: #715314;
          letter-spacing: 2px;
          font-weight: normal;
          font-size: 13px;
        }

        table th,
        table td {
          padding: 12px 15px;
          font-weight: 300;
        }

        table tbody tr {
          border-bottom: 1px solid #dddddd;
        }

        table tbody tr:nth-of-type(even) {
          background-color: #f3f3f3;
        }

        #personal {
          margin-bottom: 18px;
        }

        .bold {
          font-weight: bold;
        }

        .align-left {
          text-align: left;
        }

        .align-center {
          text-align: center;
        }

        .align-right {
          text-align: right;
        }

        .text-sm {
          font-size: 15px;
        }

        .mr-1 {
          margin-right: 5px;
        }
      </style>
    </head>

    <body>

      <div id="personal">
        <p>
          <span class="bold text-sm mr-1">Nome:</span>          
          <span>${input.customerInfo.name}</span>
        </p>

        <p>
          <span class="bold text-sm mr-1">E-mail:</span>          
          <span>${input.customerInfo.emailAddress}</span>
        </p>

        <p>
          <span class="bold text-sm mr-1">Deseja customizar com sua marca?</span>          
          <span>${input.customized ? 'Sim' : 'Não'}</span>
        </p>
      </div>

      <table>
        <thead>
          <th class="align-center">Referência</th>
          <th class="align-left">Nome</th>
          <th class="align-right">Quantidade</th>
        </thead>
        <tbody>
          ${cartItemsTable}
        </tbody>
      </table>
    </body>

  </html>
  `

  return minified(template)
}

function minified(str: string) {
  return str.trim().replace(/^\s+|\r\n|\n|\r|(>)\s+(<)|\s+$/gm, '$1$2')
}
