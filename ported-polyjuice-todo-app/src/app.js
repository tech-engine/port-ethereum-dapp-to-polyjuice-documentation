import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3'
var App = {
    loading: false,
    contracts: {},
    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },
    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  loadWeb3: async () => {
    const providerConfig = {
        rollupTypeHash: process.env.ROLLUP_TYPE_HASH,
        ethAccountLockCodeHash: process.env.ETH_ACCOUNT_LOCK_CODE_HASH,
        web3Url:  process.env.WEB3_PROVIDER_URL
    }

    const provider = new PolyjuiceHttpProvider(process.env.WEB3_PROVIDER_URL, providerConfig)

    App.web3Provider = provider
    web3 = new Web3(provider)
  },
  loadAccount: async () => {
     const accounts = await window.ethereum.request({
			method: 'eth_requestAccounts'
		})
    web3.eth.defaultAccount = accounts[0]
    App.account = accounts[0]
    console.log(App.account)
  },
  loadContract: async () => {
    const CONTRACT_ADDR = '0x1cC2e9a5c6e1C1211076214bA01fc9371dD66D9E'

		const todoList = await $.getJSON('TodoList.json')
		App.contracts.TodoList = new web3.eth.Contract(todoList.abi, CONTRACT_ADDR)
  },
  render: async () => {
      // Prevent double render
    if (App.loading) {
      return
    }

    // Update app loading state
    App.setLoading(true)

    // Render Account
    $('#account').html(App.account)

    // Render Tasks
    await App.renderTasks()

    // Update loading state
    App.setLoading(false)
  },
  renderTasks: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.contracts.TodoList.methods.taskCount().call({
      from: App.account,
			gas: 6000000
		})

    const $taskTemplate = $('.taskTemplate')

    // Render out each task with a new task template
    for (var i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.contracts.TodoList.methods.tasks(i).call({
        from: App.account,
        gas: 6000000
      })
      console.log(task)
      const taskId = Number(task[0])
      const taskContent = task[1]
      const taskCompleted = task[2]

      // Create the html for the task
      const $newTaskTemplate = $taskTemplate.clone()
      $newTaskTemplate.find('.content').html(taskContent)
      $newTaskTemplate.find('input')
                      .prop('name', taskId)
                      .prop('checked', taskCompleted)
                      .on('click', App.toggleCompleted)

      // Put the task in the correct list
      if (taskCompleted) {
        $('#completedTaskList').append($newTaskTemplate)
      } else {
        $('#taskList').append($newTaskTemplate)
      }

      // Show the task
      $newTaskTemplate.show()
    }
  },
  createTask: async () => {
    App.setLoading(true)

    const content = $('#newTask').val()

    await App.contracts.TodoList.methods.createTask(content).send({
      from: App.account,
      gas: 6000000
    })

    window.location.reload()
  },
  toggleCompleted: async (e) => {
    App.setLoading(true)

    const taskId = e.target.name

    await App.contracts.TodoList.methods.toggleCompleted(taskId).send({
      from: App.account,
      gas: 6000000
    })

    window.location.reload()
  },
  setLoading: (boolean) => {
    App.loading = boolean
    const loader = $('#loader')
    const content = $('#content')
    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
    $(window).load(() => {
      App.load()
      window.App = App
    })
})