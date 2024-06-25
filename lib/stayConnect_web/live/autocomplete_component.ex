defmodule StayConnectWeb.AutoCompleteComponent do
  alias StayConnect.Artist

  use StayConnectWeb, :live_component
  require Logger

  @impl true
  def render(assigns) do
    ~H"""
    <div class="relative">
      <.search_input
        value={@query}
        phx-keyup="do-search"
        phx-target={@myself}
        phx-debounce="200"
        placeholder={@placeholder}
      />
      <.search_modal id="search-modal" show={@show} on_cancel={@on_cancel}>
        <.results artists={@artists} />
      </.search_modal>
    </div>
    """
  end

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
    />
    """
  end

  attr :artists, :list, required: true

  def results(assigns) do
    ~H"""
    <ul class="-mb-2 py-2 text-sm text-gray-800 flex space-y-2 flex-col" id="options" role="listbox">
      <li
        :if={@artists == []}
        id="option-none"
        role="option"
        tabindex="-1"
        class="cursor-default select-none rounded-md px-4 py-2 text-xl"
      >
        No Results
      </li>

      <button :for={artist <- @artists} id={"artist-#{artist.id}"}>
        <.result_item artist={artist} />
      </button>
    </ul>
    """
  end

  attr :artist, :map, required: true

  def result_item(assigns) do
    ~H"""
    <li
      class="cursor-default select-none rounded-md px-4 py-2 text-xl bg-zinc-100 hover:bg-zinc-800 hover:text-white hover:cursor-pointer flex flex-row space-x-2 items-center"
      id={"option-#{@artist.id}"}
      role="option"
      tabindex="-1"
    >
      <div>
        <%!-- todo image --%>
        <%= @artist.name %>
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
    <%!--  <div
      id={@id}
      phx-mounted={@show && show_modal(@id)}
      phx-remove={hide_modal(@id)}
      class="relative z-50 hidden"
    >
      <div id={"#{@id}-bg"} class="bg-zinc-50/90 fixed inset-0 transition-opacity" aria-hidden="true" />

      <div
        class="absolute inset-0 overflow-y-auto"
        aria-labelledby={"#{@id}-title"}
        aria-describedby={"#{@id}-description"}
        role="dialog"
        aria-modal="true"
        tabindex="0"
      >--%>
    <div class="flex min-h-full justify-center">
      <div class="w-full min-h-12  p-2 sm:p-4 lg:pb-6 lg:pt-0">
        <.focus_wrap
          id={"#{@id}-container"}
          phx-mounted={@show && show_modal(@id)}
          phx-window-keydown={hide_modal(@on_cancel, @id)}
          phx-key="escape"
          class="relative rounded-b-2xl bg-white p-2 shadow-lg shadow-zinc-700/10 ring-1 ring-zinc-700/10 transition min-h-[30vh] max-h-[50vh] overflow-y-scroll"
        >
          <div id={"#{@id}-content"}>
            <%= render_slot(@inner_block) %>
          </div>
        </.focus_wrap>
      </div>
    </div>
    <%!-- </div> --%>
    <%!-- </div> --%>
    """
  end

  defp search_artists(query, default) when is_binary(query) do
    try do
      Artist.searchByName(query)
    rescue
      Exqlite.Error ->
        default
    end
  end

  defp search_artists(_, default), do: default

  @impl true
  def mount(socket) do
    socket =
      socket
      |> assign(:show, false)
      |> assign(:query, "")

    {:ok, socket, temporary_assigns: [artists: []]}
  end

  @impl true
  def update(assigns, socket) do
    {:ok,
     socket
     |> assign(assigns)
     |> assign(:artists, [])
     |> assign(:query, "")}
  end

  @impl true
  def handle_event("do-search", %{"value" => value}, socket) do
    {:noreply,
     socket
     |> assign(:query, value)
     |> assign(:artists, search_artists(value, socket.assigns.artists))
     |> assign(:show, true)}
  end
end
