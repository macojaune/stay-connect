defmodule StayConnectWeb.AutoCompleteComponent do
  use StayConnectWeb, :live_component
  require Logger

  attr :show, :boolean, default: false
  attr :on_cancel, JS, default: %JS{}
  attr :type, :string, default: "featurings"
  attr :list, :list, default: []
  attr :selected, :list, default: []
  attr :search_item, :any, required: true
  attr :label, :string, default: "Rechercher"
  attr :placeholder, :string, default: "Rechercher un artiste"

  @impl true
  def render(assigns) do
    ~H"""
    <div class="relative">
      <.label><%= @label %></.label>
      <.search_input
        phx-keyup="do-search"
        phx-target={@myself}
        phx-debounce="200"
        placeholder={@placeholder}
        value={@query}
      />
      <.search_modal id={"#{@type}-modal"} show={@show} on_cancel={JS.push("cancel", target: @myself)}>
        <.results list={@list} type={@type} />
      </.search_modal>
      <div class="flex flex-row gap-4 mt-3" id={"selected-#{@type}"}>
        <span
          :for={item <- @selected}
          id={"selected-#{@type}-#{item.id}"}
          class="border px-3 py-2 rounded-md"
        >
          <%= item.name %>
          <button
            id={"remove-#{@type}-#{item.id}"}
            phx-click="remove-item"
            phx-target={@myself}
            phx-value-id={item.id}
          >
            <.icon name="hero-x-mark-solid" class="w-4 h-4" />
          </button>
        </span>
      </div>
    </div>
    """
  end

  attr :value, :any
  attr :placeholder, :string, default: "Rechercher un artiste"
  attr :rest, :global

  def search_input(assigns) do
    ~H"""
    <input
      {@rest}
      type="text"
      class="mt-2 block w-full rounded-lg text-zinc-900 focus:ring-0 sm:text-sm sm:leading-6 border-zinc-300 focus:border-zinc-400"
      placeholder={@placeholder}
      role="combobox"
      aria-expanded="false"
      aria-controls="options"
      autocomplete="off"
    />
    """
  end

  attr :list, :list, required: true
  attr :type, :string, required: true

  def results(assigns) do
    ~H"""
    <ul class="-mb-2 py-2 text-sm text-gray-800 flex space-y-2 flex-col" id="options" role="listbox">
      <li
        :if={@list == []}
        role="option"
        tabindex="-1"
        class="cursor-default select-none rounded-md px-4 py-2 text-xl"
      >
        No Results
      </li>

      <button :for={item <- @list} id={"item-#{@type}-#{item.id}"}>
        <.result_item item={item} type={@type} />
      </button>
    </ul>
    """
  end

  attr :item, :any, required: true
  attr :type, :string, required: true

  def result_item(assigns) do
    ~H"""
    <li
      class="cursor-default select-none rounded-md px-4 py-2 text-xl bg-zinc-100 hover:bg-zinc-800 hover:text-white hover:cursor-pointer flex flex-row space-x-2 items-center"
      id={"option-#{@type}-#{@item.id}"}
      role="option"
      tabindex="-1"
      phx-click="select-item"
      phx-target={"#selected-#{@type}"}
      phx-value-id={@item.id}
    >
      <div>
        <%!-- todo image --%>
        <%= @item.name %>
      </div>
    </li>
    """
  end

  attr :id, :string, required: true
  attr :show, :boolean, default: false
  attr :on_cancel, JS, default: %JS{}
  slot :inner_block, required: true

  def search_modal(assigns) do
    ~H"""
    <div id={@id} class={["flex min-h-full justify-center", @show || "hidden"]}>
      <div class="w-full min-h-12 p-2 sm:p-4 lg:pb-6 lg:pt-0">
        <.focus_wrap
          id={"#{@id}-container"}
          class="relative rounded-b-2xl bg-white p-2 shadow-lg shadow-zinc-700/10 ring-1 ring-zinc-700/10 transition min-h-[30vh] max-h-[50vh] overflow-y-scroll"
        >
          <div id={"#{@id}-content"}>
            <%= render_slot(@inner_block) %>
          </div>
        </.focus_wrap>
      </div>
    </div>
    """
  end

  @impl true
  def mount(socket) do
    socket =
      socket
      |> assign(:show, false)
      |> assign(:query, "")
      |> assign(:selected, [])

    {:ok, socket}
  end

  @impl true
  def update(assigns, socket) do
    {:ok,
      socket
      |> assign(assigns)
      |> assign(:list, [])
      |> assign(:query, "")
    }
  end

  @impl true
  def handle_event("do-search", %{"value" => value}, socket) do
    items = socket.assigns.search_item.(value)
    show = length(items) > 0
    Logger.info("Search query: #{value}, items found: #{length(items)}, Show modal: #{show}")

    {:noreply,
      socket
      |> assign(:query, value)
      |> assign(:list, items)
      |> assign(:show, show)
    }
  end

  @impl true
  def handle_event("select-item", %{"id" => item_id}, socket) do
    item = Enum.find(socket.assigns.list, fn item -> item.id == String.to_integer(item_id) end)

    if item do
      send(self(), {:selected_item, socket.assigns.id, item})
      {:noreply,socket
      |> update(:selected, &(&1 ++ [item]))
      |> assign(query: "", show: false, items: [])}
    else
      {:noreply, socket}
    end
  end

  @impl true
  def handle_event("remove-item", %{"id" => item_id}, socket) do
    updated_selected =
      Enum.reject(socket.assigns.selected, fn item -> item.id == String.to_integer(item_id) end)

    {:noreply, assign(socket, :selected, updated_selected)}
  end

  def show_results(js \\ %JS{}, id) when is_binary(id) do
    js
    |> JS.show(to: "##{id}")
    |> JS.show(
      to: "##{id}",
      time: 300,
      transition: {"transition-all transform ease-out duration-300", "opacity-0", "opacity-100"}
    )
    |> show("##{id}-container")
    # |> JS.add_class("overflow-hidden", to: "body")
    |> JS.focus_first(to: "##{id}-content")
  end

  def hide_results(js \\ %JS{}, id) do
    js
    |> JS.hide(
      to: "##{id}-container",
      transition: {"transition-all transform ease-in duration-200", "opacity-100", "opacity-0"}
    )
    # |> hide("##{id}-container")
    |> JS.hide(to: "##{id}", transition: {"block", "block", "hidden"})
    # |> JS.remove_class("overflow-hidden", to: "body")
    |> JS.pop_focus()
  end
end
